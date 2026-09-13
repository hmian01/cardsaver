import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import CreditCard from '@/components/creditcard';
import { useFeedback } from '@/components/feedback';
import {
  Button,
  Dialog,
  EmptyState,
  Header,
  Icon,
  IconButton,
  Notice,
  Screen,
  Section,
  ui,
} from '@/components/ui';
import { Fonts, theme as t } from '@/constants/theme';
import { cardsStore, useCards } from '@/store/cardsStore';
import { useVaultVisible } from '@/store/vaultSession';
import { imageUri, removeImages } from '@/utils/cardImages';
import { expiryStatus, formatCardNumber } from '@/utils/cardNumber';

export default function CardDetailsScreen() {
  const router = useRouter();
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const { cards, loading, error: loadError } = useCards();
  const card = cards.find((item) => item.id === cardId);
  const notify = useFeedback();
  const [revealed, setRevealed] = useState(false);
  const [photo, setPhoto] = useState<'frontImage' | 'backImage' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const vaultVisible = useVaultVisible();
  useEffect(() => {
    if (!vaultVisible) {
      setRevealed(false);
      setPhoto(null);
    }
  }, [vaultVisible]);
  useFocusEffect(
    useCallback(
      () => () => {
        setRevealed(false);
        setPhoto(null);
      },
      [],
    ),
  );
  if (loading)
    return (
      <Screen>
        <ActivityIndicator color={t.accent} />
      </Screen>
    );
  if (loadError)
    return (
      <Screen>
        <Header title="Card details" />
        <Notice error>{loadError}</Notice>
        <Button
          title="Try again"
          onPress={() => {
            void cardsStore.retry();
          }}
        />
      </Screen>
    );
  if (!card)
    return (
      <Screen>
        <Header title="Card details" />
        <EmptyState
          title="Card not found"
          description="This card may have been removed."
        />
      </Screen>
    );
  const copy = async (value: string, label: string) => {
    try {
      await Clipboard.setStringAsync(value);
      notify(`${label} copied`);
      void Haptics.selectionAsync().catch(() => {});
    } catch {
      setError('Could not copy. Try again.');
    }
  };
  const favorite = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await cardsStore.updateCard(card.id, { favorite: !card.favorite });
    } catch {
      setError('Could not update this card. Try again.');
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await cardsStore.removeCard(card.id);
      await removeImages(
        [card.frontImage, card.backImage],
        cardsStore.getSnapshot().cards,
      );
      setConfirmDelete(false);
      notify('Card deleted');
      router.dismissTo('/(tabs)/cards');
    } catch {
      setError('Could not delete this card. Try again.');
      setConfirmDelete(false);
    } finally {
      setBusy(false);
    }
  };
  const status = expiryStatus(card.expiry);
  return (
    <Screen>
      <Header
        title="Card details"
        right={
          <IconButton
            icon={card.favorite ? 'star' : 'star-border'}
            label={card.favorite ? 'Remove from favorites' : 'Add to favorites'}
            active={card.favorite}
            disabled={busy}
            onPress={favorite}
          />
        }
      />
      <CreditCard {...card} revealed={revealed} />
      <View style={[ui.row, { gap: 12 }]}>
        <Button
          title={revealed ? 'Hide details' : 'Reveal details'}
          icon={revealed ? 'visibility-off' : 'visibility'}
          secondary
          onPress={() => setRevealed(!revealed)}
          style={{ flex: 1 }}
        />
        <Button
          title="Edit card"
          icon="edit"
          secondary
          onPress={() =>
            router.push({
              pathname: '/(tabs)/cards/card-editor',
              params: { cardId: card.id },
            })
          }
          style={{ flex: 1 }}
        />
      </View>
      {error ? <Notice error>{error}</Notice> : null}
      {status !== 'valid' && (
        <Notice>
          {status === 'expired'
            ? 'This card has expired. Update its details when your replacement arrives.'
            : 'This card expires soon. Check with your issuer for a replacement.'}
        </Notice>
      )}
      <Section
        title="Card details"
        trailing={<Text style={ui.caption}>Tap to copy</Text>}
      >
        <View style={[ui.panel, { gap: 0, paddingVertical: 3 }]}>
          <DetailRow
            label="Card number"
            value={
              revealed
                ? formatCardNumber(card.number)
                : `•••• •••• •••• ${card.number.slice(-4)}`
            }
            onPress={() => {
              void copy(card.number, 'Card number');
            }}
            mono
          />
          <DetailRow
            label="Cardholder"
            value={card.cardholder || 'Not added'}
            onPress={
              card.cardholder
                ? () => {
                    void copy(card.cardholder, 'Cardholder');
                  }
                : undefined
            }
          />
          <DetailRow
            label="Expiry"
            value={card.expiry}
            onPress={() => {
              void copy(card.expiry, 'Expiry');
            }}
          />
          <DetailRow
            label="Security code"
            value={card.cvv ? (revealed ? card.cvv : '•••') : 'Not added'}
            onPress={
              card.cvv
                ? () => {
                    void copy(card.cvv!, 'Security code');
                  }
                : undefined
            }
            last
          />
        </View>
      </Section>
      {(card.frontImage || card.backImage) && (
        <Section title="Card photos">
          <View style={styles.photos}>
            {(['frontImage', 'backImage'] as const)
              .filter((side) => card[side])
              .map((side) => (
                <Pressable
                  key={side}
                  accessibilityRole="button"
                  accessibilityLabel={`View ${side === 'frontImage' ? 'front' : 'back'} photo`}
                  onPress={() => setPhoto(side)}
                  style={{ flex: 1, gap: 9 }}
                >
                  <Image
                    source={{ uri: imageUri(card[side]!) }}
                    style={styles.photo}
                    resizeMode="cover"
                  />
                  <View style={ui.rowBetween}>
                    <Text style={ui.caption}>
                      {side === 'frontImage' ? 'Front' : 'Back'}
                    </Text>
                    <Icon name="open-in-full" size={14} color={t.muted} />
                  </View>
                </Pressable>
              ))}
          </View>
        </Section>
      )}
      {card.note && (
        <Section title="Your note">
          <View style={ui.panel}>
            <Text selectable style={[ui.body, { color: t.text }]}>
              {card.note}
            </Text>
          </View>
        </Section>
      )}
      <Button
        title="Export this card"
        secondary
        icon="ios-share"
        onPress={() =>
          router.push({
            pathname: '/(tabs)/cards/transfer',
            params: { mode: 'export', cardId: card.id },
          })
        }
      />
      <Button
        title="Delete card"
        danger
        icon="delete-outline"
        disabled={busy}
        onPress={() => setConfirmDelete(true)}
      />
      <Dialog
        visible={confirmDelete}
        title="Delete this card?"
        description={`“${card.description}”, its photos, and its note will be removed from this device.`}
        onClose={() => {
          if (!busy) setConfirmDelete(false);
        }}
      >
        <Button
          title="Keep card"
          secondary
          disabled={busy}
          onPress={() => setConfirmDelete(false)}
        />
        <Button title="Delete card" danger loading={busy} onPress={remove} />
      </Dialog>
      <Dialog
        visible={photo !== null}
        title={photo === 'frontImage' ? 'Front of card' : 'Back of card'}
        onClose={() => setPhoto(null)}
      >
        {photo && card[photo] && (
          <ScrollView
            maximumZoomScale={4}
            minimumZoomScale={1}
            contentContainerStyle={{ alignItems: 'center' }}
          >
            <Image
              accessibilityLabel="Saved card photo"
              source={{ uri: imageUri(card[photo]!) }}
              resizeMode="contain"
              style={{ width: '100%', aspectRatio: 1.35 }}
            />
          </ScrollView>
        )}
      </Dialog>
    </Screen>
  );
}
function DetailRow({
  label,
  value,
  onPress,
  mono,
  last,
}: {
  label: string;
  value: string;
  onPress?: () => void;
  mono?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={onPress ? `Copy ${label.toLowerCase()}` : label}
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.detail,
        !last && { borderBottomWidth: 1, borderBottomColor: t.border },
      ]}
    >
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={ui.caption}>{label}</Text>
        <Text style={[styles.value, mono && { fontFamily: Fonts.mono }]}>
          {value}
        </Text>
      </View>
      {onPress && <Icon name="content-copy" size={18} color={t.subtle} />}
    </Pressable>
  );
}
const styles = StyleSheet.create({
  detail: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    paddingVertical: 17,
  },
  value: { color: t.text, fontSize: 15 },
  photos: { flexDirection: 'row', gap: 14 },
  photo: {
    width: '100%',
    aspectRatio: 1.586,
    borderRadius: 16,
    backgroundColor: t.surface,
  },
});
