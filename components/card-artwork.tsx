import { CARD_ARTWORK } from '@/constants/cardArtwork';
import type { CardProduct } from '@/utils/cardProducts';
import { Image, StyleSheet, View } from 'react-native';

export default function CardArtwork({
  product,
  onError,
}: {
  product: CardProduct;
  onError?: () => void;
}) {
  const art = CARD_ARTWORK[product.id];
  if (!art) return null;
  const crop = art.crop;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image
        accessibilityLabel={`${product.issuer} ${product.name} artwork`}
        source={art.source}
        onError={onError}
        resizeMode="stretch"
        style={
          crop
            ? {
                position: 'absolute',
                width: `${(crop.sourceWidth / crop.width) * 100}%`,
                height: `${(crop.sourceHeight / crop.height) * 100}%`,
                left: `${(-crop.x / crop.width) * 100}%`,
                top: `${(-crop.y / crop.height) * 100}%`,
              }
            : [StyleSheet.absoluteFill, { width: '100%', height: '100%' }]
        }
      />
    </View>
  );
}
