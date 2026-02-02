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

export async function inviteUser(boardId: string, email: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    // Check if user is owner of the board
    const board = await prisma.board.findUnique({
        where: { id: boardId },
        select: { userId: true },
    });

    if (!board || board.userId !== session.user.id) {
        throw new Error("Only the owner can invite users");
    }

    // Check if user is already a member
    const existingMember = await prisma.boardMember.findFirst({
        where: {
            boardId,
            user: { email },
        },
    });

    if (existingMember) {
        throw new Error("User is already a member of this board");
    }

    // Create invitation
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const invitation = await prisma.boardInvitation.create({
        data: {
            email,
            boardId,
            inviterId: session.user.id,
            token,
            expiresAt,
        },
    });

    // Check if user exists and create a notification
    const invitedUser = await prisma.user.findUnique({
        where: { email },
    });

    if (invitedUser) {
        const boardInfo = await prisma.board.findUnique({
            where: { id: boardId },
            select: { title: true },
        });

        await prisma.notification.create({
            data: {
                userId: invitedUser.id,
                type: "BOARD_INVITATION",
                title: "New Board Invitation",
                message: `${session.user.name || session.user.email} invited you to join "${boardInfo?.title}"`,
                link: `/`, // On the dashboard they'll see the invite
            },
        });
    }

    revalidatePath("/");
    return invitation;
}


export async function getPendingInvites() {
    const session = await getSession();
    if (!session) return null;

    return await prisma.boardInvitation.findMany({
        where: {
            email: session.user.email,
            expiresAt: { gt: new Date() },
        },
        include: {
            board: {
                select: { title: true },
            },
            inviter: {
                select: { name: true, email: true },
            },
        },
    });
}

export async function acceptInvite(inviteId: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const invitation = await prisma.boardInvitation.findUnique({
        where: { id: inviteId },
    });

    if (!invitation || invitation.email !== session.user.email) {
        throw new Error("Invitation not found or unauthorized");
    }

    if (new Date() > invitation.expiresAt) {
        throw new Error("Invitation expired");
    }

    // Create membership
    await prisma.boardMember.create({
        data: {
            userId: session.user.id,
            boardId: invitation.boardId,
            role: "MEMBER",
        },
    });

    // Delete invitation
    await prisma.boardInvitation.delete({
        where: { id: inviteId },
    });

    revalidatePath("/");
}

export async function declineInvite(inviteId: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const invitation = await prisma.boardInvitation.findUnique({
        where: { id: inviteId },
    });

    if (!invitation || invitation.email !== session.user.email) {
        throw new Error("Invitation not found or unauthorized");
    }

    await prisma.boardInvitation.delete({
        where: { id: inviteId },
    });

    revalidatePath("/");
}

export async function getBoardMembers(boardId: string) {
    const session = await getSession();
    if (!session) return null;

    // Check if user has access
    const membership = await prisma.boardMember.findFirst({
        where: {
            boardId,
            userId: session.user.id,
        },
    });

    const board = await prisma.board.findUnique({
        where: { id: boardId },
        select: { userId: true },
    });

    if (!membership && board?.userId !== session.user.id) {
        throw new Error("Unauthorized");
    }

    return await prisma.boardMember.findMany({
        where: { boardId },
        include: {
            user: {
                select: { name: true, email: true, image: true },
            },
        },
    });
}

export async function removeMember(boardId: string, memberId: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    const board = await prisma.board.findUnique({
        where: { id: boardId },
        select: { userId: true },
    });

    if (!board || board.userId !== session.user.id) {
        throw new Error("Only the owner can remove members");
    }

    await prisma.boardMember.delete({
        where: { id: memberId },
    });

    revalidatePath("/");
}
