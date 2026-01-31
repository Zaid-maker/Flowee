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

export async function getBoardData(): Promise<ListWithCards[] | null> {
    const session = await getSession();
    if (!session) return null;

    let lists = await prisma.list.findMany({
        where: { userId: session.user.id },
        orderBy: { order: "asc" },
        include: {
            cards: {
                orderBy: { order: "asc" },
            },
        },
    });

    // Seed default lists if empty
    if (lists.length === 0) {
        const defaultLists = ["To-Do", "Doing", "Done"];
        await Promise.all(
            defaultLists.map((title, index) =>
                prisma.list.create({
                    data: {
                        title,
                        userId: session.user.id,
                        order: index,
                    },
                })
            )
        );

        // Fetch again after seeding
        lists = await prisma.list.findMany({
            where: { userId: session.user.id },
            orderBy: { order: "asc" },
            include: {
                cards: {
                    orderBy: { order: "asc" },
                },
            },
        });
    }

    return lists;
}

export async function createList(title: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const listCount = await prisma.list.count({
        where: { userId: session.user.id },
    });

    const list = await prisma.list.create({
        data: {
            title,
            userId: session.user.id,
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

export async function createCard(listId: string, content: string, priority: "LOW" | "MEDIUM" | "HIGH" = "LOW") {
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

    // This is a simplified version, ideally you'd handle reordering of other cards too
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
