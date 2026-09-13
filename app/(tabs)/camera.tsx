import { Button, Icon, IconButton, Notice, Screen, ui } from '@/components/ui';
import { useVaultVisible } from '@/components/vault-gate';
import { theme as t } from '@/constants/theme';
import { setScanDraft } from '@/store/scanDraft';
import { brandLabel, detectBrand, formatCardNumber } from '@/utils/cardNumber';
import { extractCardData } from '@/utils/cardScanner';
import { useIsFocused } from '@react-navigation/native';
import { requireOptionalNativeModule } from 'expo';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';

const ocr =
  Platform.OS === 'web'
    ? null
    : requireOptionalNativeModule<{
        isSupported: () => boolean;
        recognizeText: (uri: string) => Promise<{ text: string }>;
      }>('ExpoMlkitOcr');
export default function CameraScreen() {
  const router = useRouter();
  const focused = useIsFocused();
  const visible = useVaultVisible();
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const cameraReady = useRef(false);
  const [ready, setReady] = useState(false);
  const [torch, setTorch] = useState(false);
  const [detected, setDetected] = useState<{
    number: string;
    expiry?: string;
  } | null>(null);
  const [error, setError] = useState('');
  const [hits, setHits] = useState(0);
  const buffer = useRef<{
    number: string;
    hits: number;
    expiry?: string;
  } | null>(null);
  const processing = useRef(false);
  const supported = Boolean(ocr?.isSupported());
  const active =
    focused && visible && permission?.granted && supported && !detected;
  useEffect(() => {
    if (!active) {
      cameraReady.current = false;
      setReady(false);
    }
    if (!focused) {
      setDetected(null);
      setTorch(false);
      buffer.current = null;
      setHits(0);
    }
  }, [active, focused]);
  useEffect(() => {
    if (!active || !ready || !cameraReady.current) return;
    let canceled = false;
    const scanningStartedAt = Date.now();
    const capture = async () => {
      if (processing.current || !camera.current || canceled) return;
      processing.current = true;
      let uri: string | undefined;
      try {
        const photo = await camera.current.takePictureAsync({ quality: 0.6 });
        uri = photo?.uri;
        if (!uri || canceled) return;
        const result = await ocr!.recognizeText(uri);
        if (canceled) return;
        const candidate = extractCardData(result.text ?? '');
        setError('');
        if (candidate.number) {
          buffer.current =
            buffer.current?.number === candidate.number
              ? {
                  ...buffer.current,
                  hits: buffer.current.hits + 1,
                  expiry: candidate.expiry ?? buffer.current.expiry,
                }
              : { number: candidate.number, hits: 1, expiry: candidate.expiry };
          setHits(buffer.current.hits);
          if (buffer.current.hits >= 2) {
            setDetected({
              number: candidate.number,
              expiry: buffer.current.expiry,
            });
            void Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            ).catch(() => {});
          }
        } else {
          buffer.current = null;
          setHits(0);
        }
      } catch {
        if (!canceled && Date.now() - scanningStartedAt >= 2_000)
          setError(
            'Couldn’t read the card. Adjust the lighting and try again.',
          );
      } finally {
        if (uri)
          await FileSystem.deleteAsync(uri, { idempotent: true }).catch(
            () => {},
          );
        processing.current = false;
      }
    };
    void capture();
    const timer = setInterval(() => {
      void capture();
    }, 300);
    return () => {
      canceled = true;
      clearInterval(timer);
    };
  }, [active, ready]);
  const allowCamera = async () => {
    try {
      if (permission && !permission.canAskAgain) await Linking.openSettings();
      else await requestPermission();
    } catch {
      setError(
        'Camera access could not be requested. Try your device settings.',
      );
    }
  };
  const add = () => {
    if (detected) setScanDraft(detected);
    router.push('/(tabs)/cards/card-editor');
  };
  return (
    <Screen>
      <View style={ui.rowBetween}>
        <View style={{ gap: 8 }}>
          <Text style={ui.eyebrow}>LESS TYPING</Text>
          <Text style={ui.title}>Scan. Save. Go.</Text>
        </View>
        {active && (
          <IconButton
            icon={torch ? 'flash-on' : 'flash-off'}
            label={torch ? 'Turn flash off' : 'Turn flash on'}
            active={torch}
            onPress={() => setTorch(!torch)}
          />
        )}
      </View>
      <Text style={ui.body}>
        Line up the front of your card. You can review every detail before
        saving.
      </Text>
      <View style={styles.cameraFrame}>
        {active ? (
          <CameraView
            ref={camera}
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={torch}
            onCameraReady={() => {
              cameraReady.current = true;
              setReady(true);
            }}
            onMountError={() =>
              setError(
                'The camera is unavailable. You can add your card manually.',
              )
            }
          />
        ) : (
          <View style={styles.placeholder}>
            <Icon
              name={detected ? 'check-circle' : 'crop-free'}
              size={50}
              color={t.accent}
            />
            <Text style={[ui.body, { textAlign: 'center' }]}>
              {detected
                ? 'Card found'
                : supported
                  ? 'Your card goes here'
                  : 'Add a card in a few taps'}
            </Text>
          </View>
        )}
        <View pointerEvents="none" style={styles.guide}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
        {active && (
          <View style={styles.status}>
            <View
              style={[
                styles.dot,
                { backgroundColor: hits ? t.accent : t.text },
              ]}
            />
            <Text style={styles.statusText}>
              {hits ? 'Hold steady…' : 'Looking for your card…'}
            </Text>
          </View>
        )}
      </View>
      {error ? <Notice error>{error}</Notice> : null}
      {!supported ? (
        <Notice>
          Scanning isn’t available here. You can enter the details manually and
          attach a card photo.
        </Notice>
      ) : !permission?.granted ? (
        <Button
          title={
            permission && !permission.canAskAgain
              ? 'Open camera settings'
              : 'Allow camera access'
          }
          icon="photo-camera"
          onPress={allowCamera}
        />
      ) : null}
      {detected && (
        <View style={ui.panel}>
          <View style={ui.rowBetween}>
            <Text style={ui.sectionTitle}>Got it.</Text>
            <Text style={{ color: t.accent }}>
              {brandLabel(detectBrand(detected.number))}
            </Text>
          </View>
          <Text style={styles.number}>{formatCardNumber(detected.number)}</Text>
          {detected.expiry && (
            <Text style={ui.body}>Expires {detected.expiry}</Text>
          )}
          <Button title="Review card" icon="arrow-forward" onPress={add} />
          <Button
            title="Scan again"
            secondary
            onPress={() => {
              setDetected(null);
              setHits(0);
              buffer.current = null;
              setError('');
            }}
          />
        </View>
      )}
      {!detected && (
        <Button
          title="Enter details manually"
          secondary
          icon="edit"
          onPress={add}
        />
      )}
      <View style={[ui.row, { justifyContent: 'center' }]}>
        <Icon name="phonelink-lock" size={15} color={t.subtle} />
        <Text style={ui.caption}>
          Scanned on your device. Photos aren’t kept.
        </Text>
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  cameraFrame: {
    height: 290,
    borderRadius: 27,
    backgroundColor: t.surface,
    overflow: 'hidden',
    borderColor: t.border,
    borderWidth: 1,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  guide: { position: 'absolute', left: 22, right: 22, top: 48, bottom: 48 },
  corner: {
    width: 24,
    height: 24,
    borderColor: t.accent,
    position: 'absolute',
  },
  tl: {
    top: 0,
    left: 0,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 10,
  },
  tr: {
    top: 0,
    right: 0,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 10,
  },
  bl: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 10,
  },
  br: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 10,
  },
  status: {
    position: 'absolute',
    bottom: 17,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(16,19,16,0.8)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: { color: t.text, fontSize: 11 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  number: { fontSize: 22, color: t.text, letterSpacing: 1 },
});
