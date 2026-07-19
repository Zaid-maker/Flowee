import { create } from 'zustand';
import * as actions from './actions/board';
import * as collabActions from './actions/collaboration';
import * as labelActions from './actions/label';

export type Priority = 'low' | 'medium' | 'high';

export interface Subtask {
    id: string;
    content: string;
    completed: boolean;
}

export interface Label {
    id: string;
    name: string;
    color: string;
}

export interface Card {
    id: string;
    content: string;
    description: string | null;
    priority: Priority;
    deadline?: string | null;
    subtasks?: Subtask[];
    labels?: Label[];
}

export interface List {
    id: string;
    title: string;
    cards: Card[];
}

export interface Board {
    id: string;
    title: string;
    description: string | null;
    color: string | null;
    background: string | null;
    userId: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export type BoardRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface BoardInvite {
    id: string;
    email: string;
    role: BoardRole;
    boardId: string;
    board: { title: string };
    inviter: { name: string | null; email: string };
    createdAt: Date | string;
    expiresAt: Date | string;
}

export interface BoardMember {
    id: string;
    role: BoardRole;
    userId: string;
    boardId: string;
    user: { name: string | null; email: string; image: string | null };
}

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    link?: string | null;
    isRead: boolean;
    createdAt: Date;
}

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
}


interface BoardStore {
    boards: Board[];
    lists: List[];
    isLoaded: boolean;
    activeBoardId: string | null;
    activeCardId: string | null;
    setBoards: (boards: Board[]) => void;
    addBoard: (title: string) => Promise<Board>;
    deleteBoard: (id: string) => Promise<void>;
    selectBoard: (id: string | null) => void;
    openCardDetails: (cardId: string) => void;
    closeCardDetails: () => void;
    setLists: (lists: List[]) => void;
    addList: (title: string) => Promise<void>;
    deleteList: (listId: string) => Promise<void>;
    addCard: (listId: string, content: string, priority?: Priority) => Promise<void>;
    deleteCard: (listId: string, cardId: string) => Promise<void>;
    moveCard: (sourceListId: string, destListId: string, cardId: string, index: number) => Promise<void>;
    reorderCards: (listId: string, startIndex: number, endIndex: number) => Promise<void>;
    updateCard: (listId: string, cardId: string, updates: Partial<Card>) => Promise<void>;

    // Labels
    boardLabels: Label[];
    setBoardLabels: (labels: Label[]) => void;
    addLabel: (name: string, color: string) => Promise<void>;
    editLabel: (labelId: string, data: { name?: string; color?: string }) => Promise<void>;
    removeLabel: (labelId: string) => Promise<void>;
    toggleCardLabel: (listId: string, cardId: string, label: Label) => Promise<void>;

    // Collaboration
    invites: BoardInvite[];
    activeBoardMembers: BoardMember[];
    isFetchingInvites: boolean;
    isFetchingMembers: boolean;
    fetchInvites: () => Promise<void>;
    acceptInvite: (inviteId: string) => Promise<void>;
    declineInvite: (inviteId: string) => Promise<void>;
    inviteUser: (email: string) => Promise<void>;
    fetchBoardMembers: () => Promise<void>;
    updateMemberRole: (memberId: string, role: "ADMIN" | "MEMBER" | "VIEWER") => Promise<void>;
    removeMember: (memberId: string) => Promise<void>;

    // Notifications
    notifications: Notification[];
    isFetchingNotifications: boolean;
    fetchNotifications: () => Promise<void>;
    markNotificationAsRead: (id: string) => Promise<void>;
    markAllNotificationsAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;

    // Toasts
    toasts: Toast[];
    addToast: (message: string, type?: Toast['type']) => void;
    removeToast: (id: string) => void;
}


export const useBoardStore = create<BoardStore>((set, get) => ({
    boards: [],
    lists: [],
    isLoaded: false,
    activeBoardId: null,
    activeCardId: null,
    boardLabels: [],
    invites: [],
    activeBoardMembers: [],
    isFetchingInvites: false,
    isFetchingMembers: false,
    notifications: [],
    isFetchingNotifications: false,
    toasts: [],

    setBoards: (boards) => set({ boards }),

    addBoard: async (title) => {
        const newBoard = await actions.createBoard(title);
        set((state) => ({
            boards: [newBoard, ...state.boards],
            activeBoardId: newBoard.id,
            lists: [],
            isLoaded: false
        }));
        get().addToast(`Board "${title}" created successfully!`, 'success');
        return newBoard;
    },


    deleteBoard: async (id) => {
        const board = get().boards.find(b => b.id === id);
        await actions.deleteBoard(id);
        const state = get();
        set({
            boards: state.boards.filter(b => b.id !== id),
            activeBoardId: state.activeBoardId === id ? null : state.activeBoardId,
            lists: state.activeBoardId === id ? [] : state.lists,
        });
        get().addToast(`Board "${board?.title}" deleted.`, 'info');
    },

    selectBoard: (id) => set({ activeBoardId: id, lists: [], isLoaded: false }),

    setLists: (lists) => set({ lists, isLoaded: true }),

    openCardDetails: (cardId) => set({ activeCardId: cardId }),
    closeCardDetails: () => set({ activeCardId: null }),

    addList: async (title) => {
        const { activeBoardId } = get();
        if (!activeBoardId) return;

        try {
            const newList = await actions.createList(activeBoardId, title);
            set((state) => ({
                lists: [...state.lists, { id: newList.id, title: newList.title, cards: [] }],
            }));
            get().addToast(`List "${title}" added.`, 'success');
        } catch (error: any) {
            get().addToast(error.message || 'Failed to add list.', 'error');
        }
    },

    deleteList: async (listId) => {
        const list = get().lists.find(l => l.id === listId);
        // Optimistic removal with rollback on failure
        const snapshot = get().lists;
        set((state) => ({
            lists: state.lists.filter((l) => l.id !== listId),
        }));
        try {
            await actions.deleteList(listId);
            get().addToast(`List "${list?.title}" removed.`, 'info');
        } catch (error: any) {
            set({ lists: snapshot });
            get().addToast(error.message || 'Failed to remove list.', 'error');
        }
    },

    addCard: async (listId, content, priority = 'low') => {
        const { activeBoardId } = get();
        if (!activeBoardId) return;

        const prismaPriority = priority.toUpperCase() as "LOW" | "MEDIUM" | "HIGH";
        try {
            const newCard = await actions.createCard(activeBoardId, listId, content, prismaPriority);
            set((state) => ({
                lists: state.lists.map((l) =>
                    l.id === listId
                        ? {
                            ...l,
                            cards: [
                                ...l.cards,
                                {
                                    id: newCard.id,
                                    content: newCard.content,
                                    priority,
                                    description: null,
                                    subtasks: []
                                },
                            ],
                        }
                        : l
                ),
            }));
            get().addToast('Card added to list.', 'success');
        } catch (error: any) {
            get().addToast(error.message || 'Failed to add card.', 'error');
        }
    },

    deleteCard: async (listId, cardId) => {
        // Optimistic removal with rollback on failure
        const snapshot = get().lists;
        set((state) => ({
            lists: state.lists.map((l) =>
                l.id === listId ? { ...l, cards: l.cards.filter((c) => c.id !== cardId) } : l
            ),
        }));
        try {
            await actions.deleteCard(cardId);
            get().addToast('Card deleted.', 'info');
        } catch (error: any) {
            set({ lists: snapshot });
            get().addToast(error.message || 'Failed to delete card.', 'error');
        }
    },

    moveCard: async (sourceListId, destListId, cardId, index) => {
        // Optimistic update
        const state = get();
        const snapshot = state.lists;
        const sourceList = state.lists.find((l) => l.id === sourceListId);
        const destList = state.lists.find((l) => l.id === destListId);
        if (!sourceList || !destList) return;

        const card = sourceList.cards.find((c) => c.id === cardId);
        if (!card) return;

        const newSourceCards = sourceList.cards.filter((c) => c.id !== cardId);
        const newDestCards = Array.from(destList.cards);

        if (sourceListId === destListId) {
            newDestCards.splice(sourceList.cards.indexOf(card), 1);
            newDestCards.splice(index, 0, card);
        } else {
            newDestCards.splice(index, 0, card);
        }

        set({
            lists: state.lists.map((l) => {
                if (l.id === sourceListId) return { ...l, cards: newSourceCards };
                if (l.id === destListId) return { ...l, cards: newDestCards };
                return l;
            }),
        });

        // Sync with DB, rolling back the optimistic move if it fails
        try {
            if (sourceListId === destListId) {
                const cardIds = newDestCards.map(c => c.id);
                await actions.reorderCards(sourceListId, cardIds);
            } else {
                await actions.moveCard(cardId, destListId, index);
            }
        } catch (error: any) {
            set({ lists: snapshot });
            get().addToast(error.message || 'Failed to move card.', 'error');
        }
    },

    reorderCards: async (listId, startIndex, endIndex) => {
        const state = get();
        const snapshot = state.lists;
        const list = state.lists.find(l => l.id === listId);
        if (!list) return;

        const newCards = Array.from(list.cards);
        const [removed] = newCards.splice(startIndex, 1);
        newCards.splice(endIndex, 0, removed);

        set({
            lists: state.lists.map(l => l.id === listId ? { ...l, cards: newCards } : l)
        });

        try {
            const cardIds = newCards.map(c => c.id);
            await actions.reorderCards(listId, cardIds);
        } catch (error: any) {
            set({ lists: snapshot });
            get().addToast(error.message || 'Failed to reorder cards.', 'error');
        }
    },

    updateCard: async (listId, cardId, updates) => {
        const prismaData: any = { ...updates };
        if (updates.priority) {
            prismaData.priority = updates.priority.toUpperCase();
        }

        try {
            await actions.updateCard(cardId, prismaData);
            set((state) => ({
                lists: state.lists.map((l) =>
                    l.id === listId
                        ? {
                            ...l,
                            cards: l.cards.map((c) => (c.id === cardId ? { ...c, ...updates } : c)),
                        }
                        : l
                ),
            }));
        } catch (error: any) {
            get().addToast(error.message || 'Failed to update card.', 'error');
        }
    },

    // Label Actions
    setBoardLabels: (labels) => set({ boardLabels: labels }),

    addLabel: async (name, color) => {
        const { activeBoardId } = get();
        if (!activeBoardId) return;
        try {
            const label = await labelActions.createLabel(activeBoardId, name, color);
            set((state) => ({ boardLabels: [...state.boardLabels, label] }));
            get().addToast(`Label "${label.name}" created.`, 'success');
        } catch (error: any) {
            get().addToast(error.message || 'Failed to create label.', 'error');
        }
    },

    editLabel: async (labelId, data) => {
        const snapshot = { boardLabels: get().boardLabels, lists: get().lists };
        // Optimistic: update the label everywhere it appears.
        set((state) => ({
            boardLabels: state.boardLabels.map((l) => (l.id === labelId ? { ...l, ...data } : l)),
            lists: state.lists.map((list) => ({
                ...list,
                cards: list.cards.map((c) => ({
                    ...c,
                    labels: c.labels?.map((l) => (l.id === labelId ? { ...l, ...data } : l)),
                })),
            })),
        }));
        try {
            await labelActions.updateLabel(labelId, data);
        } catch (error: any) {
            set(snapshot);
            get().addToast(error.message || 'Failed to update label.', 'error');
        }
    },

    removeLabel: async (labelId) => {
        const snapshot = { boardLabels: get().boardLabels, lists: get().lists };
        // Optimistic: drop the label from the board and every card.
        set((state) => ({
            boardLabels: state.boardLabels.filter((l) => l.id !== labelId),
            lists: state.lists.map((list) => ({
                ...list,
                cards: list.cards.map((c) => ({
                    ...c,
                    labels: c.labels?.filter((l) => l.id !== labelId),
                })),
            })),
        }));
        try {
            await labelActions.deleteLabel(labelId);
            get().addToast('Label deleted.', 'info');
        } catch (error: any) {
            set(snapshot);
            get().addToast(error.message || 'Failed to delete label.', 'error');
        }
    },

    toggleCardLabel: async (listId, cardId, label) => {
        const snapshot = get().lists;
        const card = get().lists.find((l) => l.id === listId)?.cards.find((c) => c.id === cardId);
        if (!card) return;
        const attached = !!card.labels?.some((l) => l.id === label.id);

        // Optimistic toggle
        set((state) => ({
            lists: state.lists.map((l) =>
                l.id === listId
                    ? {
                        ...l,
                        cards: l.cards.map((c) =>
                            c.id === cardId
                                ? {
                                    ...c,
                                    labels: attached
                                        ? (c.labels ?? []).filter((x) => x.id !== label.id)
                                        : [...(c.labels ?? []), label],
                                }
                                : c
                        ),
                    }
                    : l
            ),
        }));

        try {
            await labelActions.toggleCardLabel(cardId, label.id, !attached);
        } catch (error: any) {
            set({ lists: snapshot });
            get().addToast(error.message || 'Failed to update label.', 'error');
        }
    },

    // Collaboration Actions
    fetchInvites: async () => {
        if (get().isFetchingInvites) return;
        set({ isFetchingInvites: true });
        try {
            const invites = await collabActions.getPendingInvites();
            set({ invites: invites || [] });
        } finally {
            set({ isFetchingInvites: false });
        }
    },

    acceptInvite: async (inviteId) => {
        await collabActions.acceptInvite(inviteId);
        const { fetchInvites, setBoards, addToast } = get();
        await fetchInvites();
        const boards = await actions.getBoards();
        if (boards) setBoards(boards);
        addToast("Invitation accepted!", "success");
    },

    declineInvite: async (inviteId) => {
        await collabActions.declineInvite(inviteId);
        get().fetchInvites();
        get().addToast("Invitation declined.", "info");
    },


    inviteUser: async (email) => {
        const { activeBoardId } = get();
        if (!activeBoardId) return;
        try {
            await collabActions.inviteUser(activeBoardId, email);
            get().addToast(`Invitation sent to ${email}`, 'success');
        } catch (error: any) {
            get().addToast(error.message || "Failed to send invitation", 'error');
        }
    },

    fetchBoardMembers: async () => {
        const { activeBoardId, isFetchingMembers } = get();
        if (!activeBoardId || isFetchingMembers) return;

        set({ isFetchingMembers: true });
        try {
            const members = await collabActions.getBoardMembers(activeBoardId);
            set({ activeBoardMembers: members || [] });
        } finally {
            set({ isFetchingMembers: false });
        }
    },

    updateMemberRole: async (memberId, role) => {
        const { activeBoardId, addToast } = get();
        if (!activeBoardId) return;

        try {
            await collabActions.updateMemberRole(activeBoardId, memberId, role);
            set((state) => ({
                activeBoardMembers: state.activeBoardMembers.map((m) =>
                    m.id === memberId ? { ...m, role } : m
                ),
            }));
            addToast("Role updated", "success");
        } catch (error: any) {
            addToast(error.message || "Failed to update role", "error");
        }
    },

    removeMember: async (memberId) => {
        const { activeBoardId, addToast } = get();
        if (!activeBoardId) return;

        try {
            await collabActions.removeMember(activeBoardId, memberId);
            set((state) => ({
                activeBoardMembers: state.activeBoardMembers.filter((m) => m.id !== memberId),
            }));
            addToast("Member removed", "info");
        } catch (error: any) {
            addToast(error.message || "Failed to remove member", "error");
        }
    },

    // Notifications Actions
    fetchNotifications: async () => {
        if (get().isFetchingNotifications) return;

        set({ isFetchingNotifications: true });
        try {
            const { getNotifications } = await import("./actions/notification");
            const notifications = await getNotifications();
            // Convert string dates to Date objects if necessary
            const mappedNotifications = notifications.map(n => ({
                ...n,
                createdAt: new Date(n.createdAt),
            }));
            set({ notifications: mappedNotifications });
        } finally {
            set({ isFetchingNotifications: false });
        }
    },

    markNotificationAsRead: async (id) => {
        const { markAsRead } = await import("./actions/notification");
        await markAsRead(id);
        const { notifications } = get();
        set({
            notifications: notifications.map(n =>
                n.id === id ? { ...n, isRead: true } : n
            )
        });
    },

    markAllNotificationsAsRead: async () => {
        const { markAllAsRead } = await import("./actions/notification");
        await markAllAsRead();
        const { notifications } = get();
        set({
            notifications: notifications.map(n => ({ ...n, isRead: true }))
        });
    },

    deleteNotification: async (id) => {
        const { deleteNotification } = await import("./actions/notification");
        await deleteNotification(id);
        const { notifications } = get();
        set({
            notifications: notifications.filter(n => n.id !== id)
        });
    },

    // Toast Actions
    addToast: (message, type = 'info') => {
        const id = Math.random().toString(36).substring(7);
        set((state) => ({
            toasts: [...state.toasts, { id, message, type }]
        }));

        // Auto remove toast after 3 seconds
        setTimeout(() => {
            get().removeToast(id);
        }, 3000);
    },

    removeToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id)
        }));
    },
}));

