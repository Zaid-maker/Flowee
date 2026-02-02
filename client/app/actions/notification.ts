"use server";

import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

const prisma = getPrisma();

async function getSession() {
    return await auth.api.getSession({
        headers: await headers(),
    });
}

export async function getNotifications() {
    const session = await getSession();
    if (!session) return [];

    return await prisma.notification.findMany({
        where: {
            userId: session.user.id,
        },
        orderBy: {
            createdAt: "desc",
        },
        take: 20,
    });
}

export async function markAsRead(id: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    await prisma.notification.update({
        where: {
            id,
            userId: session.user.id,
        },
        data: {
            isRead: true,
        },
    });

    revalidatePath("/");
}

export async function markAllAsRead() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    await prisma.notification.updateMany({
        where: {
            userId: session.user.id,
            isRead: false,
        },
        data: {
            isRead: true,
        },
    });

    revalidatePath("/");
}

export async function deleteNotification(id: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    await prisma.notification.delete({
        where: {
            id,
            userId: session.user.id,
        },
    });

    revalidatePath("/");
}

export async function createNotification(userId: string, data: {
    type: string;
    title: string;
    message: string;
    link?: string;
}) {
    return await prisma.notification.create({
        data: {
            userId,
            ...data,
        },
    });
}
