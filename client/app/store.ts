import { create } from 'zustand';
import * as actions from './actions/board';
import * as collabActions from './actions/collaboration';

export type Priority = 'low' | 'medium' | 'high';

export interface Subtask {
    id: string;
    content: string;
    completed: boolean;
}

export interface Card {
    id: string;
    content: string;
    description: string | null;
    priority: Priority;
    deadline?: string;
    subtasks?: Subtask[];
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
    addBoard: (title: string) => Promise<void>;
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

    // Collaboration
    invites: any[];
    activeBoardMembers: any[];
    isFetchingInvites: boolean;
    isFetchingMembers: boolean;
    fetchInvites: () => Promise<void>;
    acceptInvite: (inviteId: string) => Promise<void>;
    declineInvite: (inviteId: string) => Promise<void>;
    inviteUser: (email: string) => Promise<void>;
    fetchBoardMembers: () => Promise<void>;

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
        }));
        get().addToast(`Board "${title}" created successfully!`, 'success');
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

        const newList = await actions.createList(activeBoardId, title);
        set((state) => ({
            lists: [...state.lists, { id: newList.id, title: newList.title, cards: [] }],
        }));
        get().addToast(`List "${title}" added.`, 'success');
    },

    deleteList: async (listId) => {
        const list = get().lists.find(l => l.id === listId);
        await actions.deleteList(listId);
        set((state) => ({
            lists: state.lists.filter((l) => l.id !== listId),
        }));
        get().addToast(`List "${list?.title}" removed.`, 'info');
    },

    addCard: async (listId, content, priority = 'low') => {
        const { activeBoardId } = get();
        if (!activeBoardId) return;

        const prismaPriority = priority.toUpperCase() as "LOW" | "MEDIUM" | "HIGH";
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
    },

    deleteCard: async (listId, cardId) => {
        await actions.deleteCard(cardId);
        set((state) => ({
            lists: state.lists.map((l) =>
                l.id === listId ? { ...l, cards: l.cards.filter((c) => c.id !== cardId) } : l
            ),
        }));
        get().addToast('Card deleted.', 'info');
    },

    moveCard: async (sourceListId, destListId, cardId, index) => {
        // Optimistic update
        const state = get();
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

        // Sync with DB
        if (sourceListId === destListId) {
            const cardIds = newDestCards.map(c => c.id);
            await actions.reorderCards(sourceListId, cardIds);
        } else {
            await actions.moveCard(cardId, destListId, index);
        }
    },

    reorderCards: async (listId, startIndex, endIndex) => {
        const state = get();
        const list = state.lists.find(l => l.id === listId);
        if (!list) return;

        const newCards = Array.from(list.cards);
        const [removed] = newCards.splice(startIndex, 1);
        newCards.splice(endIndex, 0, removed);

        set({
            lists: state.lists.map(l => l.id === listId ? { ...l, cards: newCards } : l)
        });

        const cardIds = newCards.map(c => c.id);
        await actions.reorderCards(listId, cardIds);
    },

    updateCard: async (listId, cardId, updates) => {
        const prismaData: any = { ...updates };
        if (updates.priority) {
            prismaData.priority = updates.priority.toUpperCase();
        }

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

