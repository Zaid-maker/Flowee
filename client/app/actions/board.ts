"use server";

import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { checkAccess, requireWriteAccess } from "@/lib/authz";

const prisma = getPrisma();

export type ListWithCards = Prisma.ListGetPayload<{
    include: { cards: { include: { labels: true } } };
}>;

async function getSession() {
    return await auth.api.getSession({
        headers: await headers(),
    });
}

export async function getBoards() {
    const session = await getSession();
    if (!session) return null;

    return await prisma.board.findMany({
        where: {
            OR: [
                { userId: session.user.id },
                { members: { some: { userId: session.user.id } } }
            ]
        },
        orderBy: { updatedAt: "desc" },
    });
}

export async function createBoard(title: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const board = await prisma.board.create({
        data: {
            title,
            userId: session.user.id,
        },
    });

    // Seed default lists for the new board
    const defaultLists = ["To-Do", "Doing", "Done"];
    const defaultLabels = [
        { name: "Bug", color: "#ef4444" },
        { name: "Feature", color: "#3b82f6" },
        { name: "Enhancement", color: "#8b5cf6" },
        { name: "Urgent", color: "#f59e0b" },
    ];
    await Promise.all([
        prisma.list.createMany({
            data: defaultLists.map((title, index) => ({
                title,
                userId: session.user.id,
                boardId: board.id,
                order: index,
            })),
        }),
        prisma.label.createMany({
            data: defaultLabels.map((label) => ({
                ...label,
                boardId: board.id,
            })),
        }),
    ]);

    revalidatePath("/");
    return board;
}

export async function deleteBoard(id: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    await prisma.board.delete({
        where: { id, userId: session.user.id },
    });

    revalidatePath("/");
}

export async function getBoard(boardId: string) {
    const session = await getSession();
    if (!session) return null;

    const hasAccess = await checkAccess(boardId, session.user.id);
    if (!hasAccess) return null;

    return await prisma.board.findUnique({
        where: { id: boardId },
    });
}

export async function getBoardData(boardId: string): Promise<ListWithCards[] | null> {
    const session = await getSession();
    if (!session) return null;

    const hasAccess = await checkAccess(boardId, session.user.id);
    if (!hasAccess) return null;

    return await prisma.list.findMany({
        where: {
            boardId: boardId
        },
        orderBy: { order: "asc" },
        include: {
            cards: {
                orderBy: { order: "asc" },
                include: { labels: true },
            },
        },
    });
}

export async function createList(boardId: string, title: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    await requireWriteAccess(boardId, session.user.id);

    const listCount = await prisma.list.count({
        where: { boardId },
    });

    const list = await prisma.list.create({
        data: {
            title,
            userId: session.user.id,
            boardId,
            order: listCount,
        },
    });

    revalidatePath("/");
    return list;
}

export async function deleteList(listId: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const list = await prisma.list.findUnique({
        where: { id: listId },
        select: { boardId: true },
    });

    if (!list) throw new Error("List not found");

    await requireWriteAccess(list.boardId, session.user.id);

    await prisma.list.delete({
        where: { id: listId },
    });

    revalidatePath("/");
}

export async function createCard(boardId: string, listId: string, content: string, priority: "LOW" | "MEDIUM" | "HIGH" = "LOW") {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    await requireWriteAccess(boardId, session.user.id);

    const cardCount = await prisma.card.count({
        where: { listId },
    });

    const card = await prisma.card.create({
        data: {
            content,
            priority,
            listId,
            boardId,
            userId: session.user.id,
            order: cardCount,
        },
    });

    revalidatePath("/");
    return card;
}

export async function deleteCard(cardId: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const card = await prisma.card.findUnique({
        where: { id: cardId },
        select: { boardId: true },
    });

    if (!card) throw new Error("Card not found");

    await requireWriteAccess(card.boardId, session.user.id);

    await prisma.card.delete({
        where: { id: cardId },
    });

    revalidatePath("/");
}

export async function updateCard(cardId: string, data: Prisma.CardUpdateInput) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const cardRecord = await prisma.card.findUnique({
        where: { id: cardId },
        select: { boardId: true },
    });

    if (!cardRecord) throw new Error("Card not found");

    await requireWriteAccess(cardRecord.boardId, session.user.id);

    const card = await prisma.card.update({
        where: { id: cardId },
        data,
    });

    revalidatePath("/");
    return card;
}

export async function moveCard(cardId: string, newListId: string, newOrder: number) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const cardRecord = await prisma.card.findUnique({
        where: { id: cardId },
        select: { boardId: true },
    });

    if (!cardRecord) throw new Error("Card not found");

    await requireWriteAccess(cardRecord.boardId, session.user.id);

    // Ensure the destination list belongs to the same board as the card.
    const destList = await prisma.list.findUnique({
        where: { id: newListId },
        select: { boardId: true },
    });

    if (!destList || destList.boardId !== cardRecord.boardId) {
        throw new Error("Invalid destination list");
    }

    const card = await prisma.card.update({
        where: { id: cardId },
        data: {
            listId: newListId,
            order: newOrder,
        },
    });

    revalidatePath("/");
    return card;
}

export async function reorderCards(listId: string, cardIds: string[]) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const list = await prisma.list.findUnique({
        where: { id: listId },
        select: { boardId: true },
    });

    if (!list) throw new Error("List not found");

    await requireWriteAccess(list.boardId, session.user.id);

    // Batch update orders atomically so a partial failure can't corrupt ordering.
    await prisma.$transaction(
        cardIds.map((id, index) =>
            prisma.card.update({
                where: { id },
                data: { order: index },
            })
        )
    );

    revalidatePath("/");
}

export async function getCalendarCards() {
    const session = await getSession();
    if (!session) return null;

    return await prisma.card.findMany({
        where: {
            OR: [
                { userId: session.user.id },
                { board: { members: { some: { userId: session.user.id } } } }
            ],
            deadline: { not: null }
        },
        include: {
            board: {
                select: { title: true, color: true }
            }
        },
        orderBy: { deadline: "asc" }
    });
}
