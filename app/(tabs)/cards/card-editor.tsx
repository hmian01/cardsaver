import {
  useNavigation,
  usePreventRemove,
  type NavigationAction,
} from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
  Field,
  Header,
  Icon,
  Notice,
  Screen,
  Section,
  ui,
} from '@/components/ui';
import { cardPalettes, theme as t } from '@/constants/theme';
import {
  cardsStore,
  useCards,
  type CardFormData,
  type StoredCard,
} from '@/store/cardsStore';
import { takeScanDraft } from '@/store/scanDraft';
import { useSettings } from '@/store/settingsStore';
import { CARD_VARIANTS } from '@/utils/cardData';
import {
  imageUri,
  materializeImages,
  pickCardImage,
  removeImages,
} from '@/utils/cardImages';
import { defaultCardName, validateCardForm } from '@/utils/cardForm';
import {
  detectBrand,
  formatCardNumber,
  formatExpiryInput,
  normalizeExpiry,
  sanitizeCardNumber,
} from '@/utils/cardNumber';

export default function CardEditorScreen() {
  const { cardId } = useLocalSearchParams<{ cardId?: string }>();
  const { cards, loading, error } = useCards();
  const existing = cards.find((card) => card.id === cardId);
  if (loading)
    return (
      <Screen>
        <ActivityIndicator color={t.accent} />
      </Screen>
    );
  if (error || (cardId && !existing))
    return (
      <Screen>
        <Header title="Edit card" />
        <EmptyState
          title={error ? 'Wallet unavailable' : 'Card not found'}
          description={error ?? 'This card may have been removed.'}
        />
      </Screen>
    );
  return (
    <Editor
      key={cardId ?? 'new'}
      existing={existing}
      suggestedName={defaultCardName(cards)}
    />
  );
}
function Editor({
  existing,
  suggestedName,
}: {
  existing?: StoredCard;
  suggestedName: string;
}) {
  const router = useRouter();
  const navigation = useNavigation();
  const notify = useFeedback();
  const settings = useSettings();
  const [initial] = useState<CardFormData>(() => {
    const scan = existing ? undefined : takeScanDraft();
    return existing
      ? { ...existing, number: formatCardNumber(existing.number) }
      : {
          description: suggestedName,
          cardholder: settings.defaultCardholder,
          number: formatCardNumber(scan?.number ?? ''),
          expiry: scan?.expiry ?? '',
          cvv: '',
          brand: detectBrand(scan?.number ?? ''),
          variant: settings.defaultCardVariant,
          note: '',
        };
  });
  const [form, setForm] = useState(initial);
  const [colorPickerVisible, setColorPickerVisible] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CardFormData, string>>
  >({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoSide, setPhotoSide] = useState<'frontImage' | 'backImage' | null>(
    null,
  );
  const afterPhotoClose = useRef<(() => void) | null>(null);
  const [pendingAction, setPendingAction] = useState<NavigationAction | null>(
    null,
  );
  const [leave, setLeave] = useState<'discard' | 'saved' | null>(null);
  const savedId = useRef<string | null>(null);
  const dirty = JSON.stringify(initial) !== JSON.stringify(form);
  usePreventRemove((dirty || busy || photoBusy) && !leave, ({ data }) => {
    if (!busyRef.current && !photoBusy) setPendingAction(data.action);
  });
  useEffect(() => {
    if (leave === 'discard' && pendingAction)
      navigation.dispatch(pendingAction);
    if (leave === 'saved') {
      if (existing && router.canGoBack()) router.back();
      else
        router.replace({
          pathname: '/(tabs)/cards/card-details',
          params: { cardId: savedId.current! },
        });
    }
  }, [existing, leave, navigation, pendingAction, router]);
  const update = <K extends keyof CardFormData>(
    key: K,
    value: CardFormData[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };
  const choosePhoto = async (camera: boolean) => {
    const side = photoSide;
    if (!side || photoBusy) return;
    setPhotoBusy(true);
    setError('');
    if (Platform.OS === 'ios') {
      // UIKit must finish dismissing our dialog before presenting its photo picker.
      await new Promise<void>((resolve) => {
        afterPhotoClose.current = resolve;
        setPhotoSide(null);
      });
    } else setPhotoSide(null);
    try {
      const image = await pickCardImage(camera);
      if (image) update(side, image);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Photo could not be added. Try again.',
      );
    } finally {
      setPhotoBusy(false);
    }
  };
  const save = async () => {
    if (busyRef.current || photoBusy) return;
    const validation = validateCardForm(form, existing?.number);
    setErrors(validation);
    if (Object.keys(validation).length) {
      setError('Check the highlighted fields below.');
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setError('');
    let created: string[] = [];
    try {
      const data: CardFormData = {
        ...form,
        description: form.description.trim(),
        cardholder: form.cardholder.trim(),
        number: sanitizeCardNumber(form.number),
        expiry: normalizeExpiry(form.expiry)!,
        cvv: form.cvv?.trim() || undefined,
        note: form.note?.trim() || undefined,
        brand: detectBrand(form.number),
      };
      const materialized = await materializeImages(data);
      created = materialized.created;
      if (existing) {
        await cardsStore.updateCard(existing.id, materialized.card);
        savedId.current = existing.id;
      } else {
        const card = await cardsStore.addCard(materialized.card);
        savedId.current = card.id;
      }
      await removeImages(
        [existing?.frontImage, existing?.backImage],
        cardsStore.getSnapshot().cards,
      );
      notify(existing ? 'Card updated' : 'Card added to your wallet');
      setLeave('saved');
    } catch (e) {
      await removeImages(created, cardsStore.getSnapshot().cards);
      const message =
        e instanceof Error
          ? e.message
          : 'Could not save this card. Check your device storage and try again.';
      setError(message);
      if (message === 'This card is already in your wallet.')
        notify(message, 'error');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen>
        <Header
          title={existing ? 'Edit card' : 'Add a card'}
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose card color"
              accessibilityHint="Opens the card color picker"
              disabled={busy}
              onPress={() => setColorPickerVisible(true)}
              style={({ pressed }) => [
                styles.colorTrigger,
                { backgroundColor: cardPalettes[form.variant].background },
                (pressed || busy) && { opacity: 0.65 },
              ]}
            >
              <Icon
                name="palette"
                color={cardPalettes[form.variant].text}
                size={20}
              />
            </Pressable>
          }
        />
        <CreditCard
          {...form}
          brand={detectBrand(form.number)}
          revealed
          favoriteDisabled={busy}
          onFavoritePress={() => update('favorite', !form.favorite)}
        />
        {error ? <Notice error>{error}</Notice> : null}
        <Section title="The essentials">
          <Field
            label="Card name"
            placeholder="e.g. Everyday Visa"
            value={form.description}
            onChangeText={(value) => update('description', value)}
            maxLength={80}
            error={errors.description}
            editable={!busy}
          />
          <Field
            label="Card number"
            value={form.number}
            placeholder="0000 0000 0000 0000"
            keyboardType="number-pad"
            autoComplete="off"
            onChangeText={(value) =>
              update(
                'number',
                formatCardNumber(sanitizeCardNumber(value).slice(0, 19)),
              )
            }
            error={errors.number}
            editable={!busy}
          />
          <Field
            label="Cardholder"
            optional
            value={form.cardholder}
            placeholder="Name on card"
            autoCapitalize="words"
            maxLength={100}
            onChangeText={(value) => update('cardholder', value)}
            editable={!busy}
          />
          <View style={[ui.row, { alignItems: 'flex-start', gap: 14 }]}>
            <Field
              label="Expiry"
              value={form.expiry}
              placeholder="MM/YY"
              keyboardType="number-pad"
              onChangeText={(value) =>
                update('expiry', formatExpiryInput(value))
              }
              error={errors.expiry}
              editable={!busy}
            />
            <Field
              label="Security code"
              optional
              value={form.cvv ?? ''}
              placeholder="CVV"
              keyboardType="number-pad"
              maxLength={4}
              onChangeText={(value) => update('cvv', value.replace(/\D/g, ''))}
              error={errors.cvv}
              editable={!busy}
            />
          </View>
        </Section>
        <Section
          title="Card photos"
          trailing={<Text style={ui.caption}>Optional</Text>}
        >
          <View style={styles.photos}>
            {(['frontImage', 'backImage'] as const).map((side) => (
              <View key={side} style={{ flex: 1, gap: 8 }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${form[side] ? 'Change' : 'Add'} ${side === 'frontImage' ? 'front' : 'back'} photo`}
                  disabled={photoBusy || busy}
                  onPress={() => setPhotoSide(side)}
                  style={styles.photo}
                >
                  {form[side] ? (
                    <Image
                      source={{ uri: imageUri(form[side]!) }}
                      style={StyleSheet.absoluteFill}
                      resizeMode="cover"
                    />
                  ) : (
                    <>
                      <Icon
                        name="add-photo-alternate"
                        color={t.muted}
                        size={26}
                      />
                      <Text style={ui.caption}>
                        {side === 'frontImage' ? 'Front' : 'Back'}
                      </Text>
                    </>
                  )}
                </Pressable>
                {form[side] && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${side === 'frontImage' ? 'front' : 'back'}`}
                    disabled={busy}
                    onPress={() => update(side, undefined)}
                    style={styles.remove}
                  >
                    <Text style={ui.caption}>
                      Remove {side === 'frontImage' ? 'front' : 'back'}
                    </Text>
                    <Icon name="close" size={14} color={t.muted} />
                  </Pressable>
                )}
              </View>
            ))}
          </View>
          {photoBusy && <ActivityIndicator color={t.accent} />}
          <Text style={ui.caption}>Add from your library or take a photo.</Text>
        </Section>
        <Section title="A note to yourself">
          <Field
            label="Note"
            optional
            multiline
            maxLength={2000}
            value={form.note ?? ''}
            placeholder="Rewards, travel plans, or a useful reminder…"
            onChangeText={(value) => update('note', value)}
            editable={!busy}
          />
          <Text style={[ui.caption, { textAlign: 'right' }]}>
            {form.note?.length ?? 0} / 2,000
          </Text>
        </Section>
        <Button
          title={existing ? 'Save changes' : 'Save card'}
          icon="check"
          loading={busy}
          disabled={photoBusy}
          onPress={save}
        />
      </Screen>
        <Dialog
          visible={colorPickerVisible}
          title="Card color"
          onClose={() => setColorPickerVisible(false)}
        >
          <View style={styles.colorPicker}>
            {CARD_VARIANTS.map((variant) => (
              <Pressable
                key={variant}
                accessibilityRole="radio"
                accessibilityLabel={`${variant} card color`}
                accessibilityState={{ checked: form.variant === variant }}
                onPress={() => {
                  update('variant', variant);
                  setColorPickerVisible(false);
                }}
                style={[
                  styles.colorOption,
                  { backgroundColor: cardPalettes[variant].background },
                  form.variant === variant && { borderColor: t.accent },
                ]}
              >
                {form.variant === variant && (
                  <Icon
                    name="check"
                    color={cardPalettes[variant].text}
                    size={19}
                  />
                )}
              </Pressable>
            ))}
          </View>
        </Dialog>
        <Dialog
          visible={photoSide !== null}
        title={`Add ${photoSide === 'frontImage' ? 'front' : 'back'} photo`}
        onClose={() => setPhotoSide(null)}
        onDismiss={() => {
          afterPhotoClose.current?.();
          afterPhotoClose.current = null;
        }}
      >
        <Button
          title="Choose from library"
          icon="photo-library"
          onPress={() => {
            void choosePhoto(false);
          }}
        />
        <Button
          title="Take a photo"
          icon="photo-camera"
          secondary
          onPress={() => {
            void choosePhoto(true);
          }}
        />
      </Dialog>
      <Dialog
        visible={Boolean(pendingAction) && !leave}
        title="Discard changes?"
        description="Your changes haven’t been saved."
        onClose={() => setPendingAction(null)}
      >
        <Button title="Keep editing" onPress={() => setPendingAction(null)} />
        <Button
          title="Discard changes"
          danger
          onPress={() => setLeave('discard')}
        />
      </Dialog>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  colorTrigger: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: t.border,
  },
  colorPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 13,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photos: { flexDirection: 'row', gap: 14 },
  photo: {
    width: '100%',
    aspectRatio: 1.586,
    borderWidth: 1,
    borderColor: t.border,
    borderStyle: 'dashed',
    borderRadius: 17,
    backgroundColor: t.surface,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  remove: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
