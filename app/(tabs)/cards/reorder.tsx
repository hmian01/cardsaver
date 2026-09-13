import * as Haptics from 'expo-haptics';
import { usePreventRemove } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import CreditCard from '@/components/creditcard';
import { useFeedback } from '@/components/feedback';
import {
  Button,
  Header,
  Icon,
  IconButton,
  Notice,
  Screen,
  ui,
} from '@/components/ui';
import { theme as t } from '@/constants/theme';
import { cardsStore, useCards, type StoredCard } from '@/store/cardsStore';
import { brandLabel } from '@/utils/cardNumber';

export default function ReorderScreen() {
  const { cards, loading, error } = useCards();
  if (loading)
    return (
      <Screen>
        <ActivityIndicator color={t.accent} />
      </Screen>
    );
  if (error)
    return (
      <Screen>
        <Header title="Arrange cards" />
        <Notice error>{error}</Notice>
        <Button
          title="Try again"
          onPress={() => {
            void cardsStore.retry();
          }}
        />
      </Screen>
    );
  return <ReorderList initialCards={cards} />;
}

function ReorderList({ initialCards }: { initialCards: StoredCard[] }) {
  const router = useRouter();
  const notify = useFeedback();
  const [draft, setDraft] = useState(() => [...initialCards]);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  usePreventRemove(busy && !saved, () => {});
  const move = (index: number, direction: number) => {
    setDraft((cards) => {
      const next = [...cards];
      const target = index + direction;
      if (target < 0 || target >= next.length) return cards;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };
  const save = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await cardsStore.reorder(draft.map((card) => card.id));
      notify('Card order saved');
      setSaved(true);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'The order could not be saved. Try again.',
      );
    } finally {
      setBusy(false);
    }
  };
  React.useEffect(() => {
    if (saved) {
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)/cards');
    }
  }, [saved, router]);
  return (
    <Screen scroll={false}>
      <View style={[ui.content, { flexGrow: 0, paddingBottom: 20 }]}>
        <Header title="Your wallet, your order" />
        <Text style={ui.body}>
          Hold a card and drag it into place, or use the arrows.
        </Text>
        {error ? <Notice error>{error}</Notice> : null}
      </View>
      <View style={styles.list}>
        <DraggableFlatList
          data={draft}
          keyExtractor={(card) => card.id}
          onDragBegin={() => {
            setDragging(true);
            void Haptics.selectionAsync().catch(() => {});
          }}
          onDragEnd={({ data }) => {
            setDraft(data);
            setDragging(false);
          }}
          activationDistance={6}
          containerStyle={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}
          renderItem={({ item, drag, isActive, getIndex }) => {
            const index = getIndex() ?? 0;
            return (
              <ScaleDecorator>
                <View
                  style={[
                    styles.item,
                    isActive && {
                      backgroundColor: t.raised,
                      borderColor: t.accent,
                    },
                  ]}
                >
                  <Pressable
                    accessibilityLabel={`Move ${item.description}`}
                    accessibilityHint="Hold to drag, or use the move buttons"
                    accessibilityRole="button"
                    delayLongPress={180}
                    onLongPress={busy ? undefined : drag}
                    disabled={isActive || busy}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      gap: 10,
                      alignItems: 'center',
                      minHeight: 78,
                    }}
                  >
                    <Icon name="drag-indicator" size={20} color={t.subtle} />
                    <CreditCard {...item} compact />
                    <View style={{ flex: 1, gap: 5 }}>
                      <Text numberOfLines={1} style={ui.label}>
                        {item.description}
                      </Text>
                      <Text style={ui.caption}>
                        {brandLabel(item.brand)} · {item.number.slice(-4)}
                      </Text>
                    </View>
                  </Pressable>
                  <View>
                    <IconButton
                      icon="keyboard-arrow-up"
                      label={`Move ${item.description} up`}
                      disabled={index === 0 || busy || dragging}
                      onPress={() => move(index, -1)}
                    />
                    <IconButton
                      icon="keyboard-arrow-down"
                      label={`Move ${item.description} down`}
                      disabled={index === draft.length - 1 || busy || dragging}
                      onPress={() => move(index, 1)}
                    />
                  </View>
                </View>
              </ScaleDecorator>
            );
          }}
        />
      </View>
      <View style={[ui.content, { flexGrow: 0, paddingTop: 12 }]}>
        <Button
          title="Save order"
          icon="check"
          onPress={save}
          loading={busy}
          disabled={dragging}
        />
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  list: { flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center' },
  item: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: t.surface,
    borderWidth: 1,
    borderColor: t.border,
    padding: 12,
    marginBottom: 12,
  },
});
