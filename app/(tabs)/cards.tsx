import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

import CreditCard from '@/components/creditcard';
import Toast from '@/components/toast';
import { Fonts } from '@/constants/theme';
import { cardsStore, type StoredCard } from '@/store/cardsStore';

const sanitize = (value: string) => value.replace(/\s+/g, '').toLowerCase();

export default function CardsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [cards, setCards] = useState<StoredCard[]>(() => cardsStore.getCards());
  const [toastMessage, setToastMessage] = useState('');
  const [cardPendingDelete, setCardPendingDelete] = useState<StoredCard | null>(null);
  const pendingToastReset = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerToast = (message: string) => {
    if (pendingToastReset.current) {
      clearTimeout(pendingToastReset.current);
    }
    setToastMessage('');
    pendingToastReset.current = setTimeout(() => {
      setToastMessage(message);
      pendingToastReset.current = null;
    }, 0);
  };

  useEffect(() => {
    const unsubscribe = cardsStore.subscribe(setCards);
    return () => {
      unsubscribe();
      if (pendingToastReset.current) {
        clearTimeout(pendingToastReset.current);
      }
    };
  }, []);

  const filteredCards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return cards;
    const digitQuery = searchQuery.replace(/\D/g, '');
    return cards.filter((card) => {
      const description = card.description.toLowerCase();
      const holder = card.cardholder.toLowerCase();
      const digits = sanitize(card.number);
      return (
        description.includes(query) ||
        holder.includes(query) ||
        (digitQuery && digits.includes(digitQuery))
      );
    });
  }, [cards, searchQuery]);

  const handleCopy = () => {
    triggerToast(`Copied to clipboard`);
  };

  const handleDeleteModal = async (card: StoredCard) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCardPendingDelete(card);
  }

  const cancelDelete = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCardPendingDelete(null);
  };

  const handleDelete = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (cardPendingDelete) {
      cardsStore.removeCard(cardPendingDelete.id);
      triggerToast('Card deleted');
      setCardPendingDelete(null);
    }
  };

  const cardsReturn = encodeURIComponent('/(tabs)/cards');

  const handleAddNew = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/card-editor?returnTo=${cardsReturn}`)
  };
  const handleEdit = async (cardId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/card-editor?cardId=${cardId}&returnTo=${cardsReturn}`);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroLabel}>Active Wallet</Text>
            <Text style={styles.heroTitle}>You have {cards.length} saved cards</Text>
            <Text style={styles.heroSubtitle}>Search, edit, or add new payment methods.</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
            <MaterialIcons name="add" size={22} color="#050710" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color="rgba(255,255,255,0.5)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by nickname, holder, or digits"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={18} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.cardStack}>
          {filteredCards.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No cards match that search</Text>
              <Text style={styles.emptySubtitle}>Try a different keyword or add a new card.</Text>
              <TouchableOpacity style={styles.emptyCta} onPress={handleAddNew}>
                <Text style={styles.emptyCtaText}>Add a card</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredCards.reverse().map((card) => (
              <View key={card.id} style={styles.cardWrapper}>
                <CreditCard {...card} onCopy={handleCopy} />
                <View style={styles.cardActions}>

                  <TouchableOpacity
                    style={[styles.iconButton, styles.deleteButton]}
                    onPress={() => handleDeleteModal(card)}
                    accessibilityLabel={`Delete ${card.description}`}
                  >
                    <MaterialIcons name="delete" size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleEdit(card.id)}
                    accessibilityLabel={`Edit ${card.description}`}
                  >
                    <MaterialIcons name="edit" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={!!cardPendingDelete} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <MaterialIcons name="warning" size={30} color="#FF6B6B" />
            <Text style={styles.modalTitle}>Delete this card?</Text>
            <Text style={styles.modalSubtitle}>
              {cardPendingDelete?.description || 'This card'} will be permanently removed.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={cancelDelete}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleDelete}
              >
                <Text style={styles.confirmText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast toastText={toastMessage} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#050710',
    marginTop: 50,
  },
  container: {
    padding: 24,
    paddingBottom: 140,
    gap: 18,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F1324',
    borderRadius: 28,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  heroTextBlock: {
    flex: 1,
    gap: 6,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.6,
    fontSize: 12,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 24,
    fontFamily: Fonts.rounded,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#A5F276',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B0F1E',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
  },
  cardStack: {
    gap: 18,
  },
  cardWrapper: {
    position: 'relative',
  },
  cardActions: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  deleteButton: {
    backgroundColor: 'rgba(255,107,107,0.75)',
    borderColor: 'rgba(255,255,255,0.4)',
  },
  emptyState: {
    backgroundColor: '#0F1324',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 10,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
  },
  emptyCta: {
    marginTop: 6,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  emptyCtaText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5,7,16,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#0F1324',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  modalSubtitle: {
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  confirmButton: {
    backgroundColor: '#FF6B6B',
  },
  cancelText: {
    color: '#fff',
    fontWeight: '600',
  },
  confirmText: {
    color: '#050710',
    fontWeight: '700',
  },
});
