"use server";

import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

const prisma = getPrisma();

export type ListWithCards = Prisma.ListGetPayload<{
    include: { cards: true };
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
        where: { userId: session.user.id },
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
    await Promise.all(
        defaultLists.map((title, index) =>
            prisma.list.create({
                data: {
                    title,
                    userId: session.user.id,
                    boardId: board.id,
                    order: index,
                },
            })
        )
    );

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

export async function getBoardData(boardId: string): Promise<ListWithCards[] | null> {
    const session = await getSession();
    if (!session) return null;

    return await prisma.list.findMany({
        where: {
            userId: session.user.id,
            boardId: boardId
        },
        orderBy: { order: "asc" },
        include: {
            cards: {
                orderBy: { order: "asc" },
            },
        },
    });
}

export async function createList(boardId: string, title: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

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

    await prisma.list.delete({
        where: { id: listId, userId: session.user.id },
    });

    revalidatePath("/");
}

export async function createCard(boardId: string, listId: string, content: string, priority: "LOW" | "MEDIUM" | "HIGH" = "LOW") {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

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

    await prisma.card.delete({
        where: { id: cardId, userId: session.user.id },
    });

    revalidatePath("/");
}

export async function updateCard(cardId: string, data: Prisma.CardUpdateInput) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const card = await prisma.card.update({
        where: { id: cardId, userId: session.user.id },
        data,
    });

    revalidatePath("/");
    return card;
}

export async function moveCard(cardId: string, newListId: string, newOrder: number) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const card = await prisma.card.update({
        where: { id: cardId, userId: session.user.id },
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

    // Batch update orders
    await Promise.all(
        cardIds.map((id, index) =>
            prisma.card.update({
                where: { id, userId: session.user.id },
                data: { order: index },
            })
        )
    );

    revalidatePath("/");
}
