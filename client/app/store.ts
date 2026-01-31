import { create } from 'zustand';
import * as actions from './actions/board';

export type Priority = 'low' | 'medium' | 'high';

export interface Subtask {
    id: string;
    content: string;
    completed: boolean;
}

export interface Card {
    id: string;
    content: string;
    priority: Priority;
    deadline?: string;
    subtasks?: Subtask[];
}

export interface List {
    id: string;
    title: string;
    cards: Card[];
}

interface BoardStore {
    lists: List[];
    isLoaded: boolean;
    setLists: (lists: List[]) => void;
    addList: (title: string) => Promise<void>;
    deleteList: (listId: string) => Promise<void>;
    addCard: (listId: string, content: string, priority?: Priority) => Promise<void>;
    deleteCard: (listId: string, cardId: string) => Promise<void>;
    moveCard: (sourceListId: string, destListId: string, cardId: string, index: number) => Promise<void>;
    reorderCards: (listId: string, startIndex: number, endIndex: number) => Promise<void>;
    updateCard: (listId: string, cardId: string, updates: Partial<Card>) => Promise<void>;
}

export const useBoardStore = create<BoardStore>((set, get) => ({
    lists: [],
    isLoaded: false,
    setLists: (lists) => set({ lists, isLoaded: true }),

    addList: async (title) => {
        const newList = await actions.createList(title);
        set((state) => ({
            lists: [...state.lists, { id: newList.id, title: newList.title, cards: [] }],
        }));
    },

    deleteList: async (listId) => {
        await actions.deleteList(listId);
        set((state) => ({
            lists: state.lists.filter((l) => l.id !== listId),
        }));
    },

    addCard: async (listId, content, priority = 'low') => {
        const prismaPriority = priority.toUpperCase() as "LOW" | "MEDIUM" | "HIGH";
        const newCard = await actions.createCard(listId, content, prismaPriority);
        set((state) => ({
            lists: state.lists.map((l) =>
                l.id === listId
                    ? {
                        ...l,
                        cards: [
                            ...l.cards,
                            { id: newCard.id, content: newCard.content, priority, subtasks: [] },
                        ],
                    }
                    : l
            ),
        }));
    },

    deleteCard: async (listId, cardId) => {
        await actions.deleteCard(cardId);
        set((state) => ({
            lists: state.lists.map((l) =>
                l.id === listId ? { ...l, cards: l.cards.filter((c) => c.id !== cardId) } : l
            ),
        }));
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
}));
