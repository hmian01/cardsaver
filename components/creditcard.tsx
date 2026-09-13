import { cardPalettes, Fonts, theme as t } from '@/constants/theme';
import { CARD_ARTWORK } from '@/constants/cardArtwork';
import type { CardFormData } from '@/store/cardsStore';
import {
  brandLabel,
  expiryStatus,
  formatCardNumber,
  sanitizeCardNumber,
} from '@/utils/cardNumber';
import { productLabel, resolveCardIdentity } from '@/utils/cardProducts';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from './ui';
import CardArtwork from './card-artwork';

type Props = CardFormData & {
  revealed?: boolean;
  compact?: boolean;
  onFavoritePress?: () => void;
  favoriteDisabled?: boolean;
};
export default function CreditCard({
  description,
  cardholder,
  number,
  expiry,
  brand,
  frontImage,
  backImage,
  note,
  variant = 'jade',
  favorite,
  revealed = false,
  compact = false,
  onFavoritePress,
  favoriteDisabled = false,
  productId,
  artwork,
}: Props) {
  const identity = resolveCardIdentity({
    number,
    description,
    productId,
    artwork,
  });
  const [failedArt, setFailedArt] = useState<string>();
  const [artWidth, setArtWidth] = useState(320);
  const product = identity.product;
  const art =
    product && identity.useArtwork && failedArt !== product.id
      ? CARD_ARTWORK[product.id]
      : undefined;
  const digits = sanitizeCardNumber(number);
  brand = identity.network;
  const p = cardPalettes[variant] ?? cardPalettes.jade;
  const status = expiry ? expiryStatus(expiry) : 'valid';
  const hasMetadata = Boolean(
    frontImage || backImage || note || status !== 'valid',
  );
  if (product && art) {
    const artText = {
      color: product.light ? '#000000' : '#FFFFFF',
      fontWeight: '700' as const,
    };
    const displayNumber = revealed
      ? formatCardNumber(digits) || '••••  ••••  ••••  ••••'
      : `••••  ${digits.slice(-4) || '••••'}`;
    // Web does not resize Text with adjustsFontSizeToFit. Size the number to its
    // measured space as well so longer PANs stay complete beside printed logos.
    const numberSpace = artWidth - 19 - (art.numberRight ?? 19) - 4;
    const numberFontSize = Math.min(
      19,
      (numberSpace - displayNumber.length) / (displayNumber.length * 0.63),
    );
    const background = (
      <CardArtwork product={product} onError={() => setFailedArt(product.id)} />
    );
    if (compact)
      return (
        <View style={[styles.mini, { backgroundColor: product.background }]}>
          {background}
          <View style={styles.miniArtDetails}>
            <Text style={[styles.miniNumber, artText]}>{digits.slice(-4)}</Text>
          </View>
        </View>
      );
    return (
      <View style={styles.artWrapper}>
        <View
          onLayout={(event) => setArtWidth(event.nativeEvent.layout.width)}
          style={[styles.artCard, { backgroundColor: product.background }]}
        >
          {background}
          <Text
            style={[
              styles.artNumber,
              artText,
              {
                fontSize: numberFontSize,
                position: 'absolute',
                top: art.numberTop ?? (art.hasNetworkLogo ? '60%' : '72%'),
                left: 19,
                right: art.numberRight ?? 19,
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.65}
          >
            {displayNumber}
          </Text>
          <View style={styles.artDetails}>
            <View style={styles.artBottom}>
              <Text
                style={[styles.artHolder, artText, { flex: 1 }]}
                numberOfLines={1}
              >
                {cardholder || 'Your name'}
              </Text>
              <Text style={[styles.artExpiry, artText]}>
                {expiry || 'MM/YY'}
              </Text>
              {art.hasNetworkLogo ? (
                <View style={{ width: '28%' }} />
              ) : (
                <Text style={[styles.artNetwork, artText]}>
                  {brand === 'AMEX' ? 'AMEX' : brandLabel(brand)}
                </Text>
              )}
            </View>
          </View>
        </View>
        <View style={styles.artCaption}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.artTitle} numberOfLines={1}>
              {description || productLabel(product)}
            </Text>
            <Text style={styles.artSubtitle} numberOfLines={1}>
              {description === productLabel(product)
                ? `${brandLabel(brand)} · ${product.kind === 'debit' ? 'Debit' : 'Credit'}`
                : productLabel(product)}
            </Text>
          </View>
          {hasMetadata && (
            <View style={styles.metadata}>
              {(frontImage || backImage) && (
                <Icon name="photo-library" size={14} color={t.muted} />
              )}
              {note && <Icon name="notes" size={14} color={t.muted} />}
              {status !== 'valid' && (
                <Text style={[styles.metaText, { color: t.warning }]}>
                  {status === 'expired' ? 'Expired' : 'Expires soon'}
                </Text>
              )}
            </View>
          )}
          {onFavoritePress ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                favorite ? 'Remove from favorites' : 'Add to favorites'
              }
              accessibilityState={{ disabled: favoriteDisabled }}
              disabled={favoriteDisabled}
              onPress={onFavoritePress}
              style={({ pressed }) => [
                styles.artFavorite,
                (pressed || favoriteDisabled) && { opacity: 0.55 },
              ]}
            >
              <Icon
                name={favorite ? 'star' : 'star-border'}
                size={23}
                color={favorite ? t.warning : t.muted}
              />
            </Pressable>
          ) : favorite ? (
            <Icon name="star" color={t.warning} size={20} />
          ) : null}
        </View>
      </View>
    );
  }
  if (compact)
    return (
      <View style={[styles.mini, { backgroundColor: p.background }]}>
        <View style={[styles.miniRing, { borderColor: p.accent }]} />
        <Icon name="credit-card" size={20} color={p.text} />
        <Text style={[styles.miniNumber, { color: p.text }]}>
          {digits.slice(-4)}
        </Text>
      </View>
    );
  return (
    <View style={[styles.card, { backgroundColor: p.background }]}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[styles.ring, { borderColor: p.accent }]} />
        <View
          style={[styles.ring, styles.innerRing, { borderColor: p.accent }]}
        />
        <View style={[styles.shine, { backgroundColor: p.accent }]} />
      </View>
      <View style={styles.top}>
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={[styles.name, { color: p.text }]} numberOfLines={1}>
            {description || 'Your card'}
          </Text>
          {hasMetadata && (
            <View style={styles.metadata}>
              {(frontImage || backImage) && (
                <Icon name="photo-library" size={13} color={p.muted} />
              )}
              {note && <Icon name="notes" size={14} color={p.muted} />}
              {status !== 'valid' && (
                <>
                  <Text style={[styles.metaText, { color: p.muted }]}>
                    {status === 'expired' ? 'Expired' : 'Expires soon'}
                  </Text>
                  <View style={styles.metaDot} />
                </>
              )}
            </View>
          )}
        </View>
        {onFavoritePress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              favorite ? 'Remove from favorites' : 'Add to favorites'
            }
            accessibilityState={{ disabled: favoriteDisabled }}
            disabled={favoriteDisabled}
            onPress={onFavoritePress}
            style={({ pressed }) => [
              styles.favoriteButton,
              { borderColor: p.muted },
              (pressed || favoriteDisabled) && { opacity: 0.55 },
            ]}
          >
            <Icon
              name={favorite ? 'star' : 'star-border'}
              size={23}
              color={favorite ? t.warning : p.text}
            />
          </Pressable>
        ) : (
          favorite && <Icon name="star" size={30} color={t.warning} />
        )}
      </View>
      <View style={styles.middle}>
        <View style={[styles.chip, { borderColor: p.muted }]}>
          <View style={[styles.chipLine, { borderColor: p.muted }]} />
          <View style={[styles.chipCenter, { borderColor: p.muted }]} />
        </View>
        <Text
          style={[styles.number, { color: p.text }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {revealed
            ? formatCardNumber(number) || '••••  ••••  ••••  ••••'
            : `••••  ••••  ${number.slice(-4) || '••••'}`}
        </Text>
      </View>
      <View style={styles.bottom}>
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={[styles.label, { color: p.muted }]}>CARDHOLDER</Text>
          <Text style={[styles.value, { color: p.text }]} numberOfLines={1}>
            {cardholder || 'Your name'}
          </Text>
        </View>
        <View style={{ gap: 5 }}>
          <Text style={[styles.label, { color: p.muted }]}>EXPIRES</Text>
          <Text style={[styles.value, { color: p.text }]}>
            {expiry || 'MM/YY'}
          </Text>
        </View>
        {brand === 'MASTERCARD' ? (
          <View style={styles.mastercard}>
            <View style={styles.masterLeft} />
            <View style={styles.masterRight} />
          </View>
        ) : (
          <Text style={[styles.brand, { color: p.text }]}>
            {brand === 'OTHER'
              ? 'CS'
              : brand === 'DISCOVER'
                ? 'DISCOVER'
                : brand}
          </Text>
        )}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  artWrapper: { gap: 12 },
  artCard: {
    width: '100%',
    aspectRatio: 1.586,
    minHeight: 190,
    maxHeight: 340,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  artDetails: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 19,
    paddingVertical: 12,
    justifyContent: 'flex-end',
    gap: 9,
  },
  artNumber: { fontSize: 19, fontFamily: Fonts.mono, letterSpacing: 1 },
  artBottom: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  artHolder: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  artExpiry: { fontFamily: Fonts.mono, fontSize: 10 },
  artNetwork: { fontSize: 12, fontWeight: '800', fontStyle: 'italic' },
  artCaption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 3,
  },
  artTitle: {
    color: t.text,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  artSubtitle: { color: t.muted, fontSize: 11 },
  artFavorite: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniArtDetails: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    paddingHorizontal: 5,
    paddingBottom: 3,
  },
  card: {
    width: '100%',
    aspectRatio: 1.62,
    minHeight: 204,
    maxHeight: 310,
    padding: 23,
    borderRadius: 25,
    overflow: 'hidden',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  ring: {
    position: 'absolute',
    width: 330,
    height: 330,
    borderRadius: 170,
    borderWidth: 45,
    right: -155,
    top: -105,
    opacity: 0.23,
  },
  innerRing: {
    width: 230,
    height: 230,
    borderRadius: 120,
    borderWidth: 1,
    right: -105,
    top: -55,
    opacity: 0.55,
  },
  shine: {
    width: 380,
    height: 120,
    position: 'absolute',
    bottom: -112,
    left: -60,
    transform: [{ rotate: '28deg' }],
    opacity: 0.2,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 14,
  },
  metaText: { fontSize: 11 },
  metaDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: t.warning,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    marginTop: -9,
    marginRight: -9,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 20, fontWeight: '600', letterSpacing: -0.5 },
  type: { fontSize: 11 },
  middle: { gap: 13, marginVertical: 13 },
  number: { fontFamily: Fonts.mono, fontSize: 22, letterSpacing: 1 },
  chip: {
    width: 33,
    height: 25,
    borderRadius: 6,
    borderWidth: 1,
    opacity: 0.8,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chipLine: { height: 10, borderTopWidth: 1, borderBottomWidth: 1 },
  chipCenter: {
    position: 'absolute',
    left: 10,
    width: 11,
    height: 25,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  bottom: { flexDirection: 'row', alignItems: 'flex-end', gap: 18 },
  label: { fontSize: 8, letterSpacing: 1.2 },
  value: { fontSize: 12, fontWeight: '500' },
  brand: { fontWeight: '800', fontStyle: 'italic', fontSize: 17 },
  mastercard: { width: 44, height: 26, flexDirection: 'row' },
  masterLeft: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#F27564',
  },
  masterRight: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#F3C66E',
    marginLeft: -10,
    opacity: 0.9,
  },
  mini: {
    width: 72,
    height: 48,
    borderRadius: 10,
    padding: 8,
    overflow: 'hidden',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  miniRing: {
    position: 'absolute',
    width: 65,
    height: 65,
    borderWidth: 12,
    borderRadius: 35,
    right: -22,
    top: -27,
    opacity: 0.4,
  },
  miniNumber: { fontFamily: Fonts.mono, fontSize: 9 },
});
