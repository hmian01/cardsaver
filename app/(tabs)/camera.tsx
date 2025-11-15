import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import type { TextRecognitionResult } from 'expo-mlkit-ocr';
import { NativeModulesProxy } from 'expo-modules-core';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Fonts } from '@/constants/theme';
import {
  detectBrand,
  formatCardNumber,
  looksLikeCardNumber,
  sanitizeCardNumber,
  type CardBrand,
} from '@/utils/cardNumber';

const FRAME_HEIGHT = 280;
const SCAN_INTERVAL = 1800;
const MIN_STABLE_MATCHES = 2;

type MlkitModule = {
  recognizeText: (uri: string) => Promise<TextRecognitionResult>;
};

const mlkitModule = NativeModulesProxy.ExpoMlkitOcr as MlkitModule | undefined;

export default function CameraTab() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const scanningProgress = useRef(new Animated.Value(0)).current;
  const scanningLoop = useRef<Animated.CompositeAnimation | null>(null);
  const processingRef = useRef(false);
  const detectionBuffer = useRef<{ value: string; hits: number } | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [status, setStatus] = useState<'requesting' | 'scanning' | 'detected' | 'error'>(
    'requesting',
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detectedNumber, setDetectedNumber] = useState<string | null>(null);
  const [detectedExpiry, setDetectedExpiry] = useState<string | null>(null);
  const expiryBuffer = useRef<{ value: string; hits: number } | null>(null);
  const [stabilityHits, setStabilityHits] = useState(0);
  const [ocrUnavailable, setOcrUnavailable] = useState(() => !mlkitModule);

  useEffect(() => {
    if (permission === null) {
      requestPermission().catch(() => {
        setStatus('error');
        setErrorMessage('We need access to the camera to scan cards.');
      });
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    scanningLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(scanningProgress, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanningProgress, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    scanningLoop.current.start();
    return () => scanningLoop.current?.stop();
  }, [scanningProgress]);

  const stabilizeCandidate = useCallback((candidate: string) => {
    if (detectionBuffer.current?.value === candidate) {
      detectionBuffer.current.hits += 1;
    } else {
      detectionBuffer.current = { value: candidate, hits: 1 };
    }
    setStabilityHits(detectionBuffer.current.hits);
    return detectionBuffer.current.hits >= MIN_STABLE_MATCHES;
  }, []);

  const stopScanningLoop = useCallback(() => {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (ocrUnavailable) {
      setStatus('error');
      setErrorMessage('Camera scan requires the ML Kit OCR native module. Rebuild the app to continue.');
      stopScanningLoop();
    }
  }, [ocrUnavailable, stopScanningLoop]);

  const captureFrame = useCallback(async () => {
    if (!cameraRef.current || processingRef.current) {
      return;
    }
    if (detectedNumber || ocrUnavailable) {
      return;
    }

    processingRef.current = true;
    setStatus('scanning');
    setErrorMessage(null);

    try {
      if (!mlkitModule) {
        setOcrUnavailable(true);
        setStatus('error');
        setErrorMessage(
          'Camera scan requires the ML Kit OCR native module. Rebuild the app to continue.',
        );
        stopScanningLoop();
        return;
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: Platform.select({ ios: 0.5, android: 0.4, default: 0.5 }),
        skipProcessing: true,
      });

      if (!photo?.uri) {
        throw new Error('Missing capture uri');
      }

      const recognition = await mlkitModule.recognizeText(photo.uri);
      const { number: numberCandidate, expiry: expiryCandidate } =
        extractCardData(recognition);

      if (numberCandidate && stabilizeCandidate(numberCandidate)) {
        setDetectedNumber(numberCandidate);
        setStatus('detected');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        stopScanningLoop();
      } else if (!numberCandidate) {
        detectionBuffer.current = null;
        setStabilityHits(0);
      }

      if (expiryCandidate && !detectedExpiry) {
        if (expiryBuffer.current?.value === expiryCandidate) {
          expiryBuffer.current.hits += 1;
        } else {
          expiryBuffer.current = { value: expiryCandidate, hits: 1 };
        }
        if (expiryBuffer.current.hits >= MIN_STABLE_MATCHES) {
          setDetectedExpiry(expiryCandidate);
        }
      } else if (!expiryCandidate && !detectedExpiry) {
        expiryBuffer.current = null;
      }

    } catch (error) {
      console.warn('Card scan failed', error);
      setStatus('error');
      setErrorMessage('Unable to read the digits. Give it another try.');
    } finally {
      processingRef.current = false;
    }
  }, [detectedExpiry, detectedNumber, ocrUnavailable, stabilizeCandidate, stopScanningLoop]);

  useEffect(() => {
    if (!permission?.granted || !isFocused || detectedNumber || ocrUnavailable) {
      stopScanningLoop();
      return;
    }

    captureFrame();
    scanTimerRef.current = setInterval(() => {
      captureFrame();
    }, SCAN_INTERVAL);

    return () => stopScanningLoop();
  }, [captureFrame, detectedNumber, isFocused, ocrUnavailable, permission?.granted, stopScanningLoop]);

  const resetDetectionState = useCallback(() => {
    setDetectedNumber(null);
    setDetectedExpiry(null);
    detectionBuffer.current = null;
    expiryBuffer.current = null;
    setStabilityHits(0);
    setStatus(permission?.granted ? 'scanning' : 'requesting');
    setErrorMessage(null);
  }, [permission?.granted]);

  const handleRescan = useCallback(async () => {
    if (ocrUnavailable) {
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    stopScanningLoop();
    resetDetectionState();
    if (permission?.granted && isFocused) {
      captureFrame();
      scanTimerRef.current = setInterval(() => {
        captureFrame();
      }, SCAN_INTERVAL);
    }
  }, [captureFrame, isFocused, ocrUnavailable, permission?.granted, resetDetectionState, stopScanningLoop]);

  const handleOpenEditor = useCallback(async () => {
    if (!detectedNumber) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const queryParts = [
      `prefillNumber=${encodeURIComponent(detectedNumber)}`,
      `returnTo=${encodeURIComponent('/(tabs)/camera')}`,
    ];
    if (detectedExpiry) {
      queryParts.push(`prefillExpiry=${encodeURIComponent(detectedExpiry)}`);
    }
    stopScanningLoop();
    resetDetectionState();
    router.push(`/(tabs)/cards/card-editor?${queryParts.join('&')}`);
  }, [detectedExpiry, detectedNumber, resetDetectionState, router, stopScanningLoop]);

  const stabilityPercent = useMemo(() => {
    const clamped = Math.min(stabilityHits, MIN_STABLE_MATCHES);
    return clamped / MIN_STABLE_MATCHES;
  }, [stabilityHits]);

  const statusCopy = useMemo(() => {
    if (ocrUnavailable) {
      return 'Camera scan requires the ML Kit OCR native module. Rebuild the app to continue.';
    }
    if (!permission?.granted) {
      return 'Allow camera access to start scanning.';
    }
    if (status === 'detected') {
      return 'We locked onto the digits.';
    }
    if (status === 'error') {
      return errorMessage ?? 'Something went wrong while reading the card.';
    }
    if (stabilityPercent > 0) {
      return 'Hold steady while we confirm the numbers.';
    }
    return 'Line up the card number in the frame.';
  }, [errorMessage, ocrUnavailable, permission?.granted, stabilityPercent, status]);

  const formattedNumber = detectedNumber
    ? formatCardNumber(detectedNumber, detectBrand(detectedNumber))
    : null;

  const scanLineStyle = useMemo(
    () => ({
      transform: [
        {
          translateY: scanningProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [24, FRAME_HEIGHT - 24],
          }),
        },
      ],
    }),
    [scanningProgress],
  );

  const shouldRenderCamera = permission?.granted && isFocused;
  const brand: CardBrand | null = detectedNumber ? detectBrand(detectedNumber) : null;

  const showPermissionFallback = permission?.granted === false;
  const rescanDisabled = showPermissionFallback || ocrUnavailable;

  useEffect(() => {
    if (!isFocused) {
      resetDetectionState();
    }
  }, [isFocused, resetDetectionState]);

  return (
    <View style={styles.screen}>
      <View style={styles.cameraWrapper}>
        {shouldRenderCamera ? (
          <CameraView
            ref={(ref) => {
              cameraRef.current = ref;
            }}
            style={styles.camera}
            facing="back"
            enableTorch={false}
            onCameraReady={() => setStatus('scanning')}
          />
        ) : (
          <View style={styles.cameraPlaceholder}>
            <MaterialIcons name="photo-camera" size={48} color="#7A7F9F" />
            <Text style={styles.placeholderText}>
              {permission?.granted ? 'Camera paused' : 'Waiting for access'}
            </Text>
          </View>
        )}

        <View pointerEvents="none" style={styles.overlay}>
          <View style={styles.overlayMask} />
          <View style={styles.focusWindow}>
            <Animated.View style={[styles.scanLine, scanLineStyle]} />
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
          <View style={styles.overlayMask} />
        </View>
      </View>

      <View style={styles.bottomCard}>
        <View style={styles.statusRow}>
          <View style={styles.statusIcon}>
            <MaterialIcons
              name={
                status === 'detected'
                  ? 'check-circle'
                  : status === 'error'
                  ? 'error-outline'
                  : 'blur-linear'
              }
              size={20}
              color={status === 'error' ? '#FF8DA1' : '#9EE0FF'}
            />
          </View>
          <Text style={styles.statusText}>{statusCopy}</Text>
        </View>

        {permission?.granted && (
          <>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { flex: stabilityPercent, opacity: stabilityPercent ? 1 : 0.2 }]} />
              <View style={{ flex: 1 - stabilityPercent }} />
            </View>

            <View style={styles.instructions}>
              <Text style={styles.instructionsTitle}>Camera guidance</Text>
              <Text style={styles.instructionsCopy}>
                Keep the digits well-lit and flat. We only capture the 15-16 numbers printed on the
                front — everything else stays off the record.
              </Text>
            </View>
          </>
        )}

        {formattedNumber && (
          <View style={styles.detectedCard}>
            <View style={styles.detectedHeader}>
              <Text style={styles.detectedLabel}>Detected number</Text>
              <Text style={styles.detectedBrand}>{brand}</Text>
            </View>
            <Text style={styles.detectedNumber}>{formattedNumber}</Text>
            {detectedExpiry && (
              <View style={styles.detectedMeta}>
                <View style={styles.detectedMetaRow}>
                  <Text style={styles.detectedMetaLabel}>Expires</Text>
                  <Text style={styles.detectedMetaValue}>{detectedExpiry}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={
              showPermissionFallback ? requestPermission : ocrUnavailable ? undefined : handleRescan
            }
            disabled={rescanDisabled}
            style={[
              styles.secondaryButton,
              rescanDisabled && styles.secondaryButtonDisabled,
            ]}
          >
            <Text style={styles.secondaryButtonText}>
              {showPermissionFallback
                ? 'Grant access'
                : ocrUnavailable
                ? 'Install OCR support'
                : 'Scan again'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!detectedNumber || ocrUnavailable) && styles.primaryButtonDisabled,
            ]}
            disabled={!detectedNumber || ocrUnavailable}
            onPress={handleOpenEditor}
          >
            <Text style={styles.primaryButtonText}>
              {ocrUnavailable
                ? 'OCR unavailable'
                : detectedNumber
                ? 'Autofill in Add Card'
                : 'Waiting for digits'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

type ExtractedCardData = {
  number: string | null;
  expiry: string | null;
};

const extractCardData = (result: TextRecognitionResult | null): ExtractedCardData => {
  if (!result) {
    return { number: null, expiry: null, name: null };
  }

  const segments = collectSegments(result);
  let number: string | null = null;
  let expiry: string | null = null;
  for (const segment of segments) {
    if (!number) {
      number = findDigitsInText(segment);
    }
    if (!expiry) {
      expiry = findExpiryInText(segment);
    }
    if (number && expiry) {
      break;
    }
  }
  return { number, expiry };
};

const collectSegments = (result: TextRecognitionResult) => {
  const segments: string[] = [];
  if (result.text) {
    segments.push(result.text);
  }
  result.blocks?.forEach((block) => {
    if (block.text) {
      segments.push(block.text);
    }
    block.lines?.forEach((line) => {
      if (line.text) {
        segments.push(line.text);
      }
      line.elements?.forEach((element) => {
        if (element.text) {
          segments.push(element.text);
        }
      });
    });
  });
  return segments;
};

const findDigitsInText = (value: string) => {
  const digits = sanitizeCardNumber(value);
  if (!digits) {
    return null;
  }

  const matches = digits.match(/\d{15,16}/g);
  if (!matches) {
    return null;
  }

  for (const match of matches) {
    if (looksLikeCardNumber(match)) {
      return match;
    }
  }

  return null;
};

const findExpiryInText = (value: string) => {
  if (!value) {
    return null;
  }
  const matches = value
    .toUpperCase()
    .matchAll(/(0[1-9]|1[0-2])\s*\/\s*(\d{2}|\d{4})/g);
  for (const match of matches) {
    const month = match[1];
    const yearRaw = match[2];
    if (!month || !yearRaw) continue;
    const year = yearRaw.length === 2 ? yearRaw : yearRaw.slice(-2);
    return `${month}/${year}`;
  }
  return null;
};


const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#050710',
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 24,
  },
  cameraWrapper: {
    borderRadius: 28,
    overflow: 'hidden',
    height: FRAME_HEIGHT,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: '#0B0F1D',
  },
  camera: {
    flex: 1,
  },
  cameraPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  placeholderText: {
    color: '#8C93AD',
    fontSize: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  overlayMask: {
    height: 24,
    backgroundColor: 'rgba(5,7,16,0.55)',
  },
  focusWindow: {
    flex: 1,
    marginHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#9EE0FF',
    opacity: 0.9,
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#9EE0FF',
    opacity: 0.9,
  },
  cornerTopLeft: {
    top: 12,
    left: 12,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTopRight: {
    top: 12,
    right: 12,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBottomLeft: {
    bottom: 12,
    left: 12,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBottomRight: {
    bottom: 12,
    right: 12,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  bottomCard: {
    backgroundColor: '#0F1324',
    borderRadius: 28,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(158,224,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  progressTrack: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#9EE0FF',
    borderRadius: 999,
  },
  instructions: {
    gap: 6,
  },
  instructionsTitle: {
    fontSize: 16,
    fontFamily: Fonts.rounded,
    color: '#fff',
  },
  instructionsCopy: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    lineHeight: 20,
  },
  detectedCard: {
    backgroundColor: '#11152A',
    borderRadius: 18,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 10,
  },
  detectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detectedLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  detectedBrand: {
    color: '#9EE0FF',
    fontSize: 14,
    fontFamily: Fonts.rounded,
    textTransform: 'uppercase',
  },
  detectedNumber: {
    fontSize: 24,
    letterSpacing: 2,
    color: '#fff',
    fontFamily: Fonts.rounded,
  },
  detectedMeta: {
    marginTop: 6,
    gap: 6,
  },
  detectedMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detectedMetaLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  detectedMetaValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonDisabled: {
    opacity: 0.4,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: Fonts.rounded,
  },
  primaryButton: {
    flex: 1.2,
    borderRadius: 999,
    backgroundColor: '#9EE0FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  primaryButtonDisabled: {
    opacity: 0.4,
  },
  primaryButtonText: {
    color: '#050710',
    fontSize: 15,
    fontFamily: Fonts.rounded,
  },
});
