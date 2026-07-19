"use server";

import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { checkAccess, requireWriteAccess } from "@/lib/authz";

const prisma = getPrisma();

async function getSession() {
    return await auth.api.getSession({
        headers: await headers(),
    });
}

export async function getBoardLabels(boardId: string) {
    const session = await getSession();
    if (!session) return null;

    const hasAccess = await checkAccess(boardId, session.user.id);
    if (!hasAccess) return null;

    return await prisma.label.findMany({
        where: { boardId },
        orderBy: { createdAt: "asc" },
    });
}

export async function createLabel(boardId: string, name: string, color: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    await requireWriteAccess(boardId, session.user.id);

    const label = await prisma.label.create({
        data: { boardId, name: name.trim() || "Label", color },
    });

    revalidatePath("/");
    return label;
}

export async function updateLabel(labelId: string, data: { name?: string; color?: string }) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const label = await prisma.label.findUnique({
        where: { id: labelId },
        select: { boardId: true },
    });
    if (!label) throw new Error("Label not found");

    await requireWriteAccess(label.boardId, session.user.id);

    const updated = await prisma.label.update({
        where: { id: labelId },
        data: {
            ...(data.name !== undefined ? { name: data.name.trim() || "Label" } : {}),
            ...(data.color !== undefined ? { color: data.color } : {}),
        },
    });

    revalidatePath("/");
    return updated;
}

export async function deleteLabel(labelId: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const label = await prisma.label.findUnique({
        where: { id: labelId },
        select: { boardId: true },
    });
    if (!label) throw new Error("Label not found");

    await requireWriteAccess(label.boardId, session.user.id);

    await prisma.label.delete({ where: { id: labelId } });

    revalidatePath("/");
}

export async function toggleCardLabel(cardId: string, labelId: string, attached: boolean) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const card = await prisma.card.findUnique({
        where: { id: cardId },
        select: { boardId: true },
    });
    if (!card) throw new Error("Card not found");

    await requireWriteAccess(card.boardId, session.user.id);

    await prisma.card.update({
        where: { id: cardId },
        data: {
            labels: attached
                ? { connect: { id: labelId } }
                : { disconnect: { id: labelId } },
        },
    });

    revalidatePath("/");
}
