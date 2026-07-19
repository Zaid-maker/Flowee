import { getPrisma } from "@/lib/prisma";
import { BoardRole } from "@prisma/client";

const prisma = getPrisma();

export type EffectiveRole = BoardRole | "OWNER";

// Resolve the caller's effective role on a board. Owner short-circuits to "OWNER".
export async function getBoardRole(boardId: string, userId: string): Promise<EffectiveRole | null> {
    const board = await prisma.board.findUnique({
        where: { id: boardId },
        select: { userId: true },
    });

    if (!board) return null;
    if (board.userId === userId) return "OWNER";

    const membership = await prisma.boardMember.findFirst({
        where: { boardId, userId },
        select: { role: true },
    });

    return membership?.role ?? null;
}

// Read access: any owner or member.
export async function checkAccess(boardId: string, userId: string) {
    return (await getBoardRole(boardId, userId)) !== null;
}

// Write access: owner or a non-viewer member. Throws if not permitted.
export async function requireWriteAccess(boardId: string, userId: string): Promise<EffectiveRole> {
    const role = await getBoardRole(boardId, userId);
    if (!role || role === "VIEWER") throw new Error("Forbidden");
    return role;
}
