import { cardPalettes, Fonts, theme as t } from '@/constants/theme';
import type { CardFormData } from '@/store/cardsStore';
import { expiryStatus, formatCardNumber } from '@/utils/cardNumber';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from './ui';

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
}: Props) {
  const p = cardPalettes[variant] ?? cardPalettes.jade;
  const status = expiry ? expiryStatus(expiry) : 'valid';
  const hasMetadata = Boolean(
    frontImage || backImage || note || status !== 'valid',
  );
  if (compact)
    return (
      <View style={[styles.mini, { backgroundColor: p.background }]}>
        <View style={[styles.miniRing, { borderColor: p.accent }]} />
        <Icon name="credit-card" size={20} color={p.text} />
        <Text style={[styles.miniNumber, { color: p.text }]}>
          {number.slice(-4)}
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
