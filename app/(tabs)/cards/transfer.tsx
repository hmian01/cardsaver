import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePreventRemove } from '@react-navigation/native';
import React, { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import CreditCard from '@/components/creditcard';
import { useFeedback } from '@/components/feedback';
import {
  Button,
  EmptyState,
  Header,
  Icon,
  Notice,
  Screen,
  ui,
} from '@/components/ui';
import { theme as t } from '@/constants/theme';
import { cardsStore, useCards, type StoredCard } from '@/store/cardsStore';
import { planImport } from '@/utils/cardData';
import { chooseBackup, exportCards } from '@/utils/cardBackup';
import { materializeImages, removeImages } from '@/utils/cardImages';
import { brandLabel } from '@/utils/cardNumber';

export default function TransferScreen() {
  const { mode, cardId } = useLocalSearchParams<{
    mode?: string;
    cardId?: string;
  }>();
  const importing = mode === 'import';
  const router = useRouter();
  const notify = useFeedback();
  const { cards, loading, error: loadError } = useCards();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(cardId ? [cardId] : []),
  );
  const [photos, setPhotos] = useState(true);
  const [cvv, setCvv] = useState(false);
  const [backup, setBackup] = useState<{
    name: string;
    cards: StoredCard[];
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);
  usePreventRemove(busy && !completed, () => {});
  React.useEffect(() => {
    if (completed) router.dismissTo('/(tabs)/cards');
  }, [completed, router]);
  const chosen = cards.filter((card) => selected.has(card.id));
  const plan = useMemo(
    () => planImport(cards, backup?.cards ?? []),
    [backup, cards],
  );
  const pick = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      const file = await chooseBackup();
      if (file) setBackup(file);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'This file could not be opened.',
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const submit = async () => {
    if (busyRef.current || loading || loadError) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    const created: string[] = [];
    try {
      if (importing) {
        const incoming: StoredCard[] = [];
        // Recalculate against the current wallet so an import never overwrites an existing card.
        const latest = planImport(
          cardsStore.getSnapshot().cards,
          backup?.cards ?? [],
        );
        for (const card of latest.additions) {
          const saved = await materializeImages(card);
          created.push(...saved.created);
          incoming.push(saved.card);
        }
        const result = await cardsStore.importCards(incoming);
        await removeImages(created, cardsStore.getSnapshot().cards);
        notify(
          `${result.added} ${result.added === 1 ? 'card' : 'cards'} imported${latest.skipped + result.skipped ? ` · ${latest.skipped + result.skipped} duplicates skipped` : ''}`,
        );
        setCompleted(true);
      } else if (chosen.length) {
        await exportCards(chosen, { photos, cvv });
        if (Platform.OS === 'web') notify('Backup downloaded');
      }
    } catch (e) {
      await removeImages(created, cardsStore.getSnapshot().cards);
      setError(
        e instanceof Error
          ? e.message
          : 'Could not complete the transfer. Try again.',
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const rows = importing ? (backup?.cards ?? []) : cards;
  const duplicateNumbers = new Set(cards.map((card) => card.number));
  return (
    <Screen scroll={false}>
      <FlatList
        data={rows}
        keyExtractor={(card, index) => `${card.id}-${index}`}
        contentContainerStyle={[ui.content, { gap: 12 }]}
        ListHeaderComponent={
          <View style={{ gap: 22, marginBottom: 12 }}>
            <Header
              title={importing ? 'Import cards' : 'Export cards'}
              subtitle={
                importing
                  ? 'Restore a CardSaver backup'
                  : 'Choose what to include'
              }
            />
            {loadError || error ? (
              <Notice error>{loadError ?? error}</Notice>
            ) : null}
            {importing ? (
              <>
                <Text style={ui.body}>
                  Restore cards, notes, colors, and photos from a backup.
                  Existing cards stay as they are.
                </Text>
                <Button
                  title={backup ? 'Choose another file' : 'Choose backup file'}
                  icon="folder-open"
                  secondary={Boolean(backup)}
                  onPress={pick}
                  loading={busy}
                  disabled={loading || Boolean(loadError)}
                />
                {backup && (
                  <View style={ui.panel}>
                    <View style={ui.row}>
                      <Icon name="description" color={t.accent} />
                      <Text numberOfLines={1} style={[ui.label, { flex: 1 }]}>
                        {backup.name}
                      </Text>
                    </View>
                    <Text style={ui.body}>
                      {plan.additions.length} new{' '}
                      {plan.additions.length === 1 ? 'card' : 'cards'} ·{' '}
                      {plan.skipped}{' '}
                      {plan.skipped === 1 ? 'duplicate' : 'duplicates'} skipped
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <>
                <Text style={ui.body}>
                  Select the cards to include in your backup. Their wallet order
                  and notes come along too.
                </Text>
                <View style={ui.panel}>
                  <Toggle
                    title="Include card photos"
                    value={photos}
                    onChange={setPhotos}
                    disabled={busy}
                  />
                  <Toggle
                    title="Include security codes"
                    value={cvv}
                    onChange={setCvv}
                    disabled={busy}
                  />
                </View>
                <Notice>
                  Backups are not encrypted and contain full card numbers
                  {photos
                    ? ', notes, and any details visible in photos'
                    : ' and notes'}
                  . Save or share them only where you trust.
                </Notice>
                {cards.length > 0 && (
                  <View style={ui.rowBetween}>
                    <Text style={ui.label}>
                      {chosen.length} of {cards.length} selected
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      disabled={busy}
                      onPress={() =>
                        setSelected(
                          chosen.length === cards.length
                            ? new Set()
                            : new Set(cards.map((card) => card.id)),
                        )
                      }
                      style={{ padding: 10 }}
                    >
                      <Text
                        style={{
                          color: t.accent,
                          fontSize: 13,
                          fontWeight: '600',
                        }}
                      >
                        {chosen.length === cards.length
                          ? 'Deselect all'
                          : 'Select all'}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </>
            )}
          </View>
        }
        renderItem={({ item, index }) => {
          const duplicate =
            importing &&
            (duplicateNumbers.has(item.number) ||
              rows.slice(0, index).some((row) => row.number === item.number));
          return (
            <Pressable
              accessibilityRole={importing ? 'text' : 'checkbox'}
              accessibilityLabel={`${item.description}, ending in ${item.number.slice(-4)}`}
              accessibilityState={
                importing
                  ? undefined
                  : { checked: selected.has(item.id), disabled: busy }
              }
              disabled={importing || busy}
              onPress={() => toggle(item.id)}
              style={[
                styles.row,
                !importing &&
                  selected.has(item.id) && {
                    borderColor: t.accent,
                    backgroundColor: '#252F20',
                  },
              ]}
            >
              <CreditCard {...item} compact />
              <View style={{ flex: 1, gap: 5 }}>
                <Text style={ui.label} numberOfLines={1}>
                  {item.description}
                </Text>
                <Text style={ui.caption}>
                  {brandLabel(item.brand)} · {item.number.slice(-4)}
                </Text>
              </View>
              <Icon
                name={
                  importing
                    ? duplicate
                      ? 'check'
                      : 'add'
                    : selected.has(item.id)
                      ? 'check-circle'
                      : 'radio-button-unchecked'
                }
                color={
                  duplicate
                    ? t.subtle
                    : !importing && !selected.has(item.id)
                      ? t.subtle
                      : t.accent
                }
              />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon={importing ? 'file-download' : 'credit-card'}
            title={
              importing
                ? backup
                  ? 'This backup is empty'
                  : 'Ready when you are.'
                : 'No cards to export'
            }
            description={
              importing
                ? backup
                  ? 'Choose a backup that contains cards.'
                  : 'Choose a CardSaver JSON file, up to 25 MB.'
                : 'Add a card to your wallet to create a backup.'
            }
          />
        }
      />
      {(importing ? Boolean(backup) : cards.length > 0) && (
        <View style={[ui.content, { paddingTop: 12, flexGrow: 0 }]}>
          <Button
            title={
              importing
                ? `Import ${plan.additions.length} ${plan.additions.length === 1 ? 'card' : 'cards'}`
                : `Export ${chosen.length} ${chosen.length === 1 ? 'card' : 'cards'}`
            }
            icon={importing ? 'file-download' : 'ios-share'}
            loading={busy}
            disabled={
              loading ||
              Boolean(loadError) ||
              (importing ? plan.additions.length === 0 : chosen.length === 0)
            }
            onPress={submit}
          />
        </View>
      )}
    </Screen>
  );
}
function Toggle({
  title,
  value,
  onChange,
  disabled,
}: {
  title: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={ui.rowBetween}>
      <Text style={[ui.label, { flex: 1 }]}>{title}</Text>
      <Switch
        {...(Platform.OS === 'web' ? { activeThumbColor: t.accent } : {})}
        accessibilityLabel={title}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: t.border, true: '#7E9B55' }}
        thumbColor={value ? t.accent : t.muted}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    padding: 15,
    borderRadius: 19,
    backgroundColor: t.surface,
    borderWidth: 1,
    borderColor: t.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
});
