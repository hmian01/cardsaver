import * as FileSystem from 'expo-file-system/legacy';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import {
  createId,
  isPortableImage,
  type CardFormData,
  type StoredCard,
} from './cardData';

export const imageUri = (image: string) =>
  image.startsWith('card-images/')
    ? `${FileSystem.documentDirectory}${image}`
    : image;

export async function pickCardImage(
  camera = false,
): Promise<string | undefined> {
  if (camera) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted)
      throw new Error(
        'Allow camera access in your device settings to take a photo.',
      );
  }
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1586, 1000],
    quality: 0.8,
  };
  const result = camera
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled) return;
  const asset = result.assets[0];
  const context = ImageManipulator.manipulate(asset.uri);
  context.resize(
    asset.width >= asset.height
      ? { width: Math.min(asset.width, 1400) }
      : { height: Math.min(asset.height, 1400) },
  );
  let rendered: Awaited<ReturnType<typeof context.renderAsync>> | undefined;
  let outputUri: string | undefined;
  try {
    rendered = await context.renderAsync();
    const output = await rendered.saveAsync({
      compress: 0.75,
      format: SaveFormat.JPEG,
      base64: true,
    });
    outputUri = output.uri;
    if (!output.base64)
      throw new Error('This photo could not be read. Try another image.');
    const data = `data:image/jpeg;base64,${output.base64}`;
    if (!isPortableImage(data))
      throw new Error(
        'This photo is too large. Try cropping it closer to the card.',
      );
    return data;
  } finally {
    context.release();
    rendered?.release();
    if (Platform.OS !== 'web' && FileSystem.cacheDirectory)
      await Promise.all(
        [asset.uri, outputUri]
          .filter((uri): uri is string =>
            Boolean(uri?.startsWith(FileSystem.cacheDirectory!)),
          )
          .map((uri) =>
            FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {}),
          ),
      );
  }
}

export async function materializeImages<T extends CardFormData>(
  card: T,
): Promise<{ card: T; created: string[] }> {
  const next = { ...card };
  const created: string[] = [];
  if (Platform.OS === 'web') return { card: next, created };
  try {
    for (const key of ['frontImage', 'backImage'] as const) {
      const data = next[key];
      if (!data || !isPortableImage(data)) continue;
      if (!FileSystem.documentDirectory)
        throw new Error('Photo storage is unavailable.');
      await FileSystem.makeDirectoryAsync(
        `${FileSystem.documentDirectory}card-images`,
        { intermediates: true },
      );
      const mime = data.slice(11, data.indexOf(';'));
      const name = `card-images/${createId()}.${mime === 'jpeg' ? 'jpg' : mime}`;
      created.push(name);
      await FileSystem.writeAsStringAsync(
        imageUri(name),
        data.slice(data.indexOf(',') + 1),
        { encoding: FileSystem.EncodingType.Base64 },
      );
      next[key] = name;
    }
    return { card: next, created };
  } catch (error) {
    await removeImages(created);
    throw error;
  }
}

export async function portableImages(
  card: StoredCard,
  include: boolean,
): Promise<StoredCard> {
  const next = { ...card };
  for (const key of ['frontImage', 'backImage'] as const) {
    const uri = next[key];
    if (!include) {
      delete next[key];
      continue;
    }
    if (!uri || isPortableImage(uri)) continue;
    try {
      const data = await FileSystem.readAsStringAsync(imageUri(uri), {
        encoding: FileSystem.EncodingType.Base64,
      });
      const extension = uri.split('.').pop();
      next[key] =
        `data:image/${extension === 'jpg' ? 'jpeg' : extension};base64,${data}`;
    } catch {
      throw new Error(
        `A photo for “${card.description}” is missing. Replace it or export without photos.`,
      );
    }
  }
  return next;
}

export async function removeImages(
  images: (string | undefined)[],
  remaining: StoredCard[] = [],
) {
  if (Platform.OS === 'web') return;
  const inUse = new Set(
    remaining.flatMap((card) => [card.frontImage, card.backImage]),
  );
  await Promise.all(
    images
      .filter(
        (uri): uri is string =>
          Boolean(uri?.startsWith('card-images/')) && !inUse.has(uri),
      )
      .map((uri) =>
        FileSystem.deleteAsync(imageUri(uri), { idempotent: true }).catch(
          () => {},
        ),
      ),
  );
}

export async function clearCardImages() {
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) return;
  await FileSystem.deleteAsync(`${FileSystem.documentDirectory}card-images`, {
    idempotent: true,
  });
}
