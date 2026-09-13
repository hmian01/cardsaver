import { cardPalettes, theme as t } from '@/constants/theme';
import { CARD_VARIANTS, type CardFormData } from '@/utils/cardData';
import { brandLabel } from '@/utils/cardNumber';
import {
  CARD_PRODUCTS,
  getCardProduct,
  normalizeProductText,
  productLabel,
  productSupportsNumber,
  resolveCardIdentity,
} from '@/utils/cardProducts';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import CreditCard from './creditcard';
import { Button, Dialog, Icon, ui } from './ui';

type Props = {
  form: CardFormData;
  onChange: (changes: Partial<CardFormData>) => void;
  disabled?: boolean;
};
export default function CardDesignPicker({ form, onChange, disabled }: Props) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const identity = resolveCardIdentity(form);
  const product = identity.product;
  const products = CARD_PRODUCTS.filter(
    (item) =>
      productSupportsNumber(item, form.number) &&
      normalizeProductText(
        [productLabel(item), ...item.aliases].join(' '),
      ).includes(normalizeProductText(search)),
  );
  const close = () => {
    setVisible(false);
    setSearch('');
  };
  const choose = (changes: Partial<CardFormData>) => {
    const selected = getCardProduct(changes.productId);
    onChange({
      ...changes,
      ...(selected &&
      (!form.description.trim() || /^Card \d+$/i.test(form.description.trim()))
        ? { description: productLabel(selected) }
        : {}),
    });
    close();
  };
  const title = product
    ? productLabel(product)
    : `${brandLabel(identity.network)} · Choose a product`;
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Change card design"
        disabled={disabled}
        onPress={() => setVisible(true)}
        style={({ pressed }) => [
          styles.control,
          (pressed || disabled) && { opacity: 0.6 },
        ]}
      >
        <View style={styles.spark}>
          <Icon name="auto-awesome" size={20} color={t.accent} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.eyebrow}>
            {form.artwork === 'color'
              ? 'CUSTOM COLOR'
              : product
                ? 'CARD RECOGNIZED'
                : 'CARD DESIGN'}
          </Text>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={ui.caption}>
            {product
              ? 'Change product or appearance'
              : 'Scan your card or choose its bank and product'}
          </Text>
        </View>
        <Icon name="chevron-right" size={21} color={t.muted} />
      </Pressable>
      <Dialog
        avoidKeyboard
        contentStyle={{ maxHeight: '100%' }}
        visible={visible}
        title="Make it your card"
        description="Choose the product printed on your card. Its design follows it everywhere."
        onClose={close}
      >
        <View style={styles.search}>
          <Icon name="search" size={20} color={t.muted} />
          <TextInput
            accessibilityLabel="Search card products"
            value={search}
            onChangeText={setSearch}
            placeholder="Bank or product name"
            placeholderTextColor={t.subtle}
            autoCorrect={false}
            style={styles.input}
          />
        </View>
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="radio"
              accessibilityLabel={productLabel(item)}
              accessibilityState={{
                checked: product?.id === item.id && form.artwork !== 'color',
              }}
              onPress={() => choose({ productId: item.id, artwork: 'auto' })}
              style={({ pressed }) => [
                styles.option,
                pressed && { backgroundColor: t.raised },
              ]}
            >
              <CreditCard
                description={productLabel(item)}
                number=""
                cardholder=""
                expiry=""
                brand={item.networks[0]}
                variant={form.variant}
                productId={item.id}
                compact
              />
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={ui.caption}>
                  {item.issuer} · {item.kind === 'debit' ? 'Debit' : 'Credit'}
                </Text>
              </View>
              {product?.id === item.id && form.artwork !== 'color' && (
                <Icon name="check-circle" size={21} color={t.accent} />
              )}
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={[ui.body, { paddingVertical: 16 }]}>
              No matching products
              {identity.network !== 'OTHER'
                ? ` for ${brandLabel(identity.network)}`
                : ''}
              . Try the bank name or use a color below.
            </Text>
          }
        />
        <Button
          title="Detect automatically"
          icon="auto-awesome"
          secondary
          onPress={() => choose({ productId: undefined, artwork: 'auto' })}
        />
        <View style={{ gap: 12 }}>
          <Text style={ui.caption}>Or use a custom color</Text>
          <View style={styles.colors}>
            {CARD_VARIANTS.map((variant) => (
              <Pressable
                key={variant}
                accessibilityRole="radio"
                accessibilityLabel={`${variant} card color`}
                hitSlop={4}
                accessibilityState={{
                  checked: form.artwork === 'color' && form.variant === variant,
                }}
                onPress={() => choose({ variant, artwork: 'color' })}
                style={[
                  styles.color,
                  { backgroundColor: cardPalettes[variant].background },
                  form.artwork === 'color' &&
                    form.variant === variant && { borderColor: t.accent },
                ]}
              >
                {form.artwork === 'color' && form.variant === variant && (
                  <Icon
                    name="check"
                    size={18}
                    color={cardPalettes[variant].text}
                  />
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </Dialog>
    </>
  );
}

const styles = StyleSheet.create({
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: t.surface,
    borderWidth: 1,
    borderColor: t.border,
    padding: 16,
    borderRadius: 18,
  },
  spark: {
    width: 37,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    color: t.accent,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  title: { color: t.text, fontSize: 14, fontWeight: '500' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 13,
    borderRadius: 12,
    backgroundColor: t.background,
  },
  input: { flex: 1, minHeight: 48, color: t.text, fontSize: 15 },
  list: { maxHeight: 265, flexGrow: 0, flexShrink: 1 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 2,
    minHeight: 72,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: t.border,
  },
  productName: { color: t.text, fontSize: 14, fontWeight: '500' },
  colors: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  color: {
    flex: 1,
    maxWidth: 44,
    aspectRatio: 1,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
