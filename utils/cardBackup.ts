import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import {
  buildBackup,
  MAX_BACKUP_BYTES,
  parseBackup,
  type StoredCard,
} from './cardData';
import { portableImages } from './cardImages';

export async function chooseBackup(): Promise<
  { name: string; cards: StoredCard[] } | undefined
> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', 'application/octet-stream'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return;
  const asset = result.assets[0];
  try {
    if ((asset.size ?? 0) > MAX_BACKUP_BYTES)
      throw new Error('Choose a backup smaller than 25 MB.');
    if (Platform.OS !== 'web') {
      const info = await FileSystem.getInfoAsync(asset.uri);
      if (!info.exists || info.isDirectory || info.size > MAX_BACKUP_BYTES)
        throw new Error('Choose a backup smaller than 25 MB.');
    }
    const text =
      Platform.OS === 'web' && asset.file
        ? await asset.file.text()
        : await FileSystem.readAsStringAsync(asset.uri);
    return { name: asset.name, cards: parseBackup(text) };
  } finally {
    if (
      Platform.OS !== 'web' &&
      asset.uri.startsWith(FileSystem.cacheDirectory ?? 'unavailable:')
    )
      await FileSystem.deleteAsync(asset.uri, { idempotent: true }).catch(
        () => {},
      );
  }
}

export async function exportCards(
  cards: StoredCard[],
  options: { photos: boolean; cvv: boolean },
) {
  // Process photos sequentially to avoid loading every source image at once.
  const portable: StoredCard[] = [];
  let bytes = 0;
  for (const card of cards) {
    const converted = await portableImages(card, options.photos);
    bytes += new TextEncoder().encode(JSON.stringify(converted)).length;
    if (bytes > MAX_BACKUP_BYTES)
      throw new Error(
        'This backup exceeds 25 MB. Select fewer cards or leave out photos.',
      );
    portable.push(converted);
  }
  const text = buildBackup(portable, options.cvv);
  const name = `cardsaver-${new Date().toISOString().slice(0, 10)}.json`;
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(
      new Blob([text], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  if (!(await Sharing.isAvailableAsync()))
    throw new Error('File sharing is unavailable on this device.');
  const uri = `${FileSystem.cacheDirectory}${name}`;
  try {
    await FileSystem.writeAsStringAsync(uri, text);
    await Sharing.shareAsync(uri, {
      mimeType: 'application/json',
      UTI: 'public.json',
      dialogTitle: 'Export cards',
    });
  } finally {
    await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
  }
}
