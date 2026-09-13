import {
  createId,
  parseStoredCards,
  planImport,
  reorderCards,
  type CardFormData,
  type StoredCard,
} from '../utils/cardData';
type Storage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<unknown>;
};
export const createCardsStore = (storage: Storage) => {
  let snapshot = {
    cards: [] as StoredCard[],
    loading: true,
    error: null as string | null,
  };
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());
  const hydrate = async () => {
    snapshot = { ...snapshot, loading: true, error: null };
    emit();
    try {
      const raw = await storage.getItem('@cardsaver/cards');
      snapshot = {
        cards: raw ? parseStoredCards(JSON.parse(raw)) : [],
        loading: false,
        error: null,
      };
    } catch {
      // Preserve the original data on disk. Never overwrite a failed read with an empty wallet.
      snapshot = {
        ...snapshot,
        loading: false,
        error:
          'Your saved cards could not be loaded. Your data has not been changed.',
      };
    }
    emit();
  };
  let ready = hydrate();
  let pending: Promise<unknown> = Promise.resolve();
  const mutate = <T>(
    fn: (cards: StoredCard[]) => { cards: StoredCard[]; result: T },
  ): Promise<T> => {
    const task = pending.then(async () => {
      await ready;
      if (snapshot.error) throw new Error(snapshot.error);
      const next = fn(snapshot.cards);
      await storage.setItem('@cardsaver/cards', JSON.stringify(next.cards));
      snapshot = { ...snapshot, cards: next.cards };
      emit();
      return next.result;
    });
    pending = task.catch(() => undefined);
    return task;
  };
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    whenReady: () => ready,
    retry: () => {
      ready = hydrate();
      return ready;
    },
    addCard: (data: CardFormData) =>
      mutate((cards) => {
        if (cards.some((card) => card.number === data.number))
          throw new Error('This card is already in your wallet.');
        const card = { ...data, id: createId() };
        return { cards: [card, ...cards], result: card };
      }),
    updateCard: (id: string, data: Partial<CardFormData>) =>
      mutate((cards) => {
        if (!cards.some((card) => card.id === id))
          throw new Error('This card no longer exists.');
        if (
          data.number &&
          cards.some((card) => card.id !== id && card.number === data.number)
        )
          throw new Error('This card is already in your wallet.');
        return {
          cards: cards.map((card) =>
            card.id === id ? { ...card, ...data } : card,
          ),
          result: undefined,
        };
      }),
    removeCard: (id: string) =>
      mutate((cards) => ({
        cards: cards.filter((card) => card.id !== id),
        result: undefined,
      })),
    clear: () => {
      const task = pending.then(async () => {
        await ready;
        await storage.setItem('@cardsaver/cards', '[]');
        snapshot = { cards: [], loading: false, error: null };
        emit();
      });
      pending = task.catch(() => undefined);
      return task;
    },
    reorder: (ids: string[]) =>
      mutate((cards) => ({
        cards: reorderCards(cards, ids),
        result: undefined,
      })),
    importCards: (incoming: StoredCard[]) =>
      mutate((cards) => {
        const { additions, skipped } = planImport(cards, incoming);
        return {
          cards: [...cards, ...additions],
          result: { added: additions.length, skipped },
        };
      }),
  };
};
