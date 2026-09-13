import CreditCard from '@/components/creditcard';
import {
  Button,
  EmptyState,
  Icon,
  IconButton,
  Notice,
  Screen,
  ui,
} from '@/components/ui';
import { theme as t } from '@/constants/theme';
import { cardsStore, useCards } from '@/store/cardsStore';
import { useSettings } from '@/store/settingsStore';
import { matchesCard } from '@/utils/cardData';
import { expiryStatus } from '@/utils/cardNumber';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Filter = 'all' | 'favorites' | 'expiring';
export default function CardsScreen() {
  const router = useRouter();
  const { cards, loading, error } = useCards();
  const { hideNumbers } = useSettings();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const expiring = cards.filter(
    (card) => expiryStatus(card.expiry) !== 'valid',
  ).length;
  const visible = useMemo(
    () =>
      cards.filter(
        (card) =>
          matchesCard(card, search) &&
          (filter === 'all' ||
            (filter === 'favorites'
              ? card.favorite
              : expiryStatus(card.expiry) !== 'valid')),
      ),
    [cards, filter, search],
  );
  const add = () => router.push('/(tabs)/cards/card-editor');
  return (
    <Screen scroll={false}>
      <FlatList
        data={visible}
        keyExtractor={(card) => card.id}
        contentContainerStyle={ui.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ gap: 26 }}>
            <View style={ui.rowBetween}>
              <View style={ui.row}>
                <View style={styles.mark}>
                  <Icon name="wallet" size={19} color={t.ink} />
                </View>
                <Text style={ui.eyebrow}>CARDSAVER</Text>
              </View>
              <View style={ui.row}>
                <View style={styles.dot} />
                <Text style={ui.caption}>On your device</Text>
              </View>
            </View>
            <View style={ui.rowBetween}>
              <View style={{ gap: 5, flex: 1 }}>
                <Text style={ui.title}>Your wallet.</Text>
                <Text style={ui.body}>
                  {cards.length === 0
                    ? 'A place for every card.'
                    : `${cards.length} saved ${cards.length === 1 ? 'card' : 'cards'}`}
                </Text>
              </View>
              <IconButton
                icon="add"
                label="Add card"
                active
                onPress={add}
                disabled={loading || Boolean(error)}
              />
            </View>
            <View style={styles.actions}>
              <Pressable
                style={styles.action}
                accessibilityRole="button"
                accessibilityLabel="Scan card"
                onPress={() => router.push('/(tabs)/camera')}
              >
                <Icon name="crop-free" color={t.accent} />
                <Text style={styles.actionLabel}>Scan card</Text>
              </Pressable>
              <Pressable
                style={styles.action}
                accessibilityRole="button"
                accessibilityLabel="Import"
                onPress={() =>
                  router.push('/(tabs)/cards/transfer?mode=import')
                }
              >
                <Icon name="file-download" color={t.accent} />
                <Text style={styles.actionLabel}>Import</Text>
              </Pressable>
              <Pressable
                style={styles.action}
                accessibilityRole="button"
                accessibilityLabel="Export"
                onPress={() =>
                  router.push('/(tabs)/cards/transfer?mode=export')
                }
              >
                <Icon name="ios-share" color={t.accent} />
                <Text style={styles.actionLabel}>Export</Text>
              </Pressable>
            </View>
            {cards.length > 0 && (
              <>
                <View style={styles.search}>
                  <Icon name="search" color={t.subtle} size={21} />
                  <TextInput
                    accessibilityLabel="Search cards"
                    placeholder="Find a card, name, or note"
                    placeholderTextColor={t.subtle}
                    value={search}
                    onChangeText={setSearch}
                    autoCorrect={false}
                    style={styles.searchInput}
                  />
                  {search ? (
                    <IconButton
                      icon="close"
                      label="Clear search"
                      onPress={() => setSearch('')}
                    />
                  ) : null}
                </View>
                <View style={ui.rowBetween}>
                  <View style={styles.filters}>
                    {(
                      [
                        ['all', 'All cards'],
                        ['favorites', 'Favorites'],
                        [
                          'expiring',
                          `Expiring${expiring ? ` · ${expiring}` : ''}`,
                        ],
                      ] as const
                    ).map(([key, label]) => (
                      <Pressable
                        key={key}
                        accessibilityRole="button"
                        accessibilityState={{ selected: filter === key }}
                        onPress={() => setFilter(key)}
                        style={[
                          styles.filter,
                          filter === key && styles.filterActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterText,
                            filter === key && { color: t.accent },
                          ]}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  {cards.length > 1 && (
                    <IconButton
                      icon="swap-vert"
                      label="Reorder cards"
                      onPress={() => router.push('/(tabs)/cards/reorder')}
                    />
                  )}
                </View>
              </>
            )}
            {error && (
              <>
                <Notice error>{error}</Notice>
                <Button
                  title="Try again"
                  secondary
                  onPress={() => {
                    void cardsStore.retry();
                  }}
                />
              </>
            )}
          </View>
        }
        renderItem={({ item }) => {
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.description}, ending in ${item.number.slice(-4)}`}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/cards/card-details',
                  params: { cardId: item.id },
                })
              }
              style={({ pressed }) => [
                styles.cardWrap,
                pressed && { opacity: 0.8 },
              ]}
            >
              <CreditCard {...item} revealed={!hideNumbers} />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={{ marginTop: 50 }} color={t.accent} />
          ) : error ? null : cards.length === 0 ? (
            <EmptyState
              icon="wallet"
              title="Make yourself at home."
              description="Save your first card, add a photo, and keep the details close."
            >
              <Button
                title="Add your first card"
                icon="add"
                onPress={add}
                style={{ marginTop: 10 }}
              />
            </EmptyState>
          ) : (
            <EmptyState
              icon="search"
              title={
                filter === 'favorites' && !search
                  ? 'Keep your go-tos close.'
                  : filter === 'expiring' && !search
                    ? 'Looking good.'
                    : 'No cards found'
              }
              description={
                filter === 'favorites' && !search
                  ? 'Tap the star in a card’s details to add it here.'
                  : filter === 'expiring' && !search
                    ? 'None of your cards expire in the next three months.'
                    : 'Try a different name, number, or note.'
              }
            >
              <Button
                title="Show all cards"
                secondary
                onPress={() => {
                  setSearch('');
                  setFilter('all');
                }}
              />
            </EmptyState>
          )
        }
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  mark: {
    backgroundColor: t.accent,
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: t.accent },
  actions: {
    flexDirection: 'row',
    backgroundColor: t.surface,
    borderColor: t.border,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 17,
  },
  action: { flex: 1, alignItems: 'center', gap: 9, minHeight: 46 },
  actionLabel: { fontSize: 12, color: t.text, fontWeight: '500' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: t.surface,
    borderRadius: 16,
    paddingLeft: 15,
    paddingRight: 5,
    minHeight: 52,
    borderWidth: 1,
    borderColor: t.border,
  },
  searchInput: { flex: 1, color: t.text, fontSize: 14, paddingVertical: 15 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, flex: 1 },
  filter: { paddingHorizontal: 10, paddingVertical: 12, borderRadius: 12 },
  filterActive: { backgroundColor: '#29351F' },
  filterText: { fontSize: 12, color: t.muted, fontWeight: '500' },
  cardWrap: { marginTop: 0 },
  footer: {
    color: t.subtle,
    textAlign: 'center',
    fontSize: 11,
    paddingVertical: 8,
  },
});
