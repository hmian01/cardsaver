import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { createCardsStore } from './createCardsStore';
export type { StoredCard, CardFormData, CardVariant } from '../utils/cardData';
export const cardsStore = createCardsStore(AsyncStorage);
export const useCards = () =>
  useSyncExternalStore(
    cardsStore.subscribe,
    cardsStore.getSnapshot,
    cardsStore.getSnapshot,
  );
