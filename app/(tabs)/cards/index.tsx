import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import CreditCard from '@/components/creditcard';
import Toast from '@/components/toast';
import { Fonts } from '@/constants/theme';
import { cardsStore, type StoredCard } from '@/store/cardsStore';
import { settingsStore } from '@/store/settingsStore';

const RELOCK_TIMEOUT_MS = 60_000;

const sanitize = (value: string) => value.replace(/\s+/g, '').toLowerCase();

let hasUnlockedVault = false;

const getAuthErrorMessage = (error?: LocalAuthentication.LocalAuthenticationError) => {
  switch (error) {
    case 'user_cancel':
    case 'system_cancel':
    case 'app_cancel':
      return 'Face ID was canceled. Please try again.';
    case 'authentication_failed':
      return 'Face ID did not recognize you. Try again.';
    case 'lockout':
      return 'Face ID is locked because of too many attempts.';
    case 'not_enrolled':
    case 'passcode_not_set':
      return 'Please set up Face ID on your device to unlock the vault.';
    case 'not_available':
      return 'Face ID is not available on this device.';
    default:
      return 'Unable to verify your identity right now.';
  }
};

export default function CardsScreen() {
  const router = useRouter();
  const isScreenFocused = useIsFocused();
  const [searchQuery, setSearchQuery] = useState('');
  const [cards, setCards] = useState<StoredCard[]>(() => cardsStore.getCards());
  const [toastMessage, setToastMessage] = useState('');
  const pendingToastReset = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(() => hasUnlockedVault);
  const isVaultUnlockedRef = useRef(isVaultUnlocked);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInFlight, setAuthInFlight] = useState(false);
  const [biometricsReady, setBiometricsReady] = useState(true);
  const lastBlurTimeRef = useRef<number | null>(null);
  const [biometricLockEnabled, setBiometricLockEnabled] = useState(
    () => settingsStore.getSettings().biometricLockEnabled,
  );

  const triggerToast = (message: string) => {
    if (pendingToastReset.current) {
      clearTimeout(pendingToastReset.current);
    }
    setToastMessage('');
    pendingToastReset.current = setTimeout(() => {
      setToastMessage(message);
      pendingToastReset.current = null;
    }, 0);
  };

  useEffect(() => {
    const unsubscribe = cardsStore.subscribe(setCards);
    const unsubscribeSettings = settingsStore.subscribe((next) => {
      setBiometricLockEnabled(next.biometricLockEnabled);
    });
    return () => {
      unsubscribe();
      unsubscribeSettings();
      if (pendingToastReset.current) {
        clearTimeout(pendingToastReset.current);
      }
    };
  }, []);

  useEffect(() => {
    isVaultUnlockedRef.current = isVaultUnlocked;
  }, [isVaultUnlocked]);

  useEffect(() => {
    if (!biometricLockEnabled) {
      hasUnlockedVault = true;
      isVaultUnlockedRef.current = true;
      setIsVaultUnlocked(true);
      setAuthError(null);
      setAuthInFlight(false);
    } else {
      hasUnlockedVault = false;
      isVaultUnlockedRef.current = false;
      setIsVaultUnlocked(false);
    }
  }, [biometricLockEnabled]);

  const filteredCards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return cards;
    const digitQuery = searchQuery.replace(/\D/g, '');
    return cards.filter((card) => {
      const description = card.description.toLowerCase();
      const holder = card.cardholder.toLowerCase();
      const digits = sanitize(card.number);
      return (
        description.includes(query) ||
        holder.includes(query) ||
        (digitQuery && digits.includes(digitQuery))
      );
    });
  }, [cards, searchQuery]);

  const handleCopy = () => {
    triggerToast(`Copied to clipboard`);
  };

  const cardsReturn = encodeURIComponent('/(tabs)/cards');

  const handleAddNew = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/(tabs)/cards/card-editor?returnTo=${cardsReturn}`);
  };
  const handleEdit = async (cardId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/(tabs)/cards/card-editor?cardId=${cardId}&returnTo=${cardsReturn}`);
  };

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const cancelledUnlock = async () =>{
    await wait(2000);
    setAuthInFlight(false);
  }

  const lockVault = useCallback(() => {
    if (!biometricLockEnabled) {
      return;
    }
    if (!isVaultUnlockedRef.current && !hasUnlockedVault) {
      return;
    }
    hasUnlockedVault = false;
    isVaultUnlockedRef.current = false;
    setIsVaultUnlocked(false);
    setAuthError(null);
    setBiometricsReady(true);
    setAuthInFlight(false);
  }, [biometricLockEnabled]);

  const attemptUnlock = useCallback(async () => {
    if (!biometricLockEnabled || isVaultUnlockedRef.current || authInFlight) {
      return;
    }

    setAuthError(null);
    setAuthInFlight(true);
    setBiometricsReady(true);

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        setAuthError('This device does not support biometric authentication.');
        setBiometricsReady(false);
        return;
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        setAuthError('Enroll Face ID on this device to unlock the vault.');
        setBiometricsReady(false);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Cards',
        fallbackLabel: 'Enter Passcode',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        hasUnlockedVault = true;
        isVaultUnlockedRef.current = true;
        setIsVaultUnlocked(true);
      } else {
        setAuthError(getAuthErrorMessage(result.error));
      }
    } catch (error) {
      console.warn('Face ID unlock failed', error);
      setAuthError('Something went wrong. Please try again.');
    } finally {
      cancelledUnlock();
    }
  }, [authInFlight, biometricLockEnabled]);

  useFocusEffect(
    useCallback(() => {
      if (!biometricLockEnabled) {
        return () => {
          lastBlurTimeRef.current = null;
        };
      }
      const now = Date.now();
      const lastBlur = lastBlurTimeRef.current;
      if (lastBlur && now - lastBlur >= RELOCK_TIMEOUT_MS) {
        lockVault();
      }
      if (!isVaultUnlockedRef.current) {
        attemptUnlock();
      }
      return () => {
        lastBlurTimeRef.current = Date.now();
      };
    }, [attemptUnlock, biometricLockEnabled, lockVault]),
  );

  useEffect(() => {
    if (!biometricLockEnabled) {
      return;
    }
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        lastBlurTimeRef.current = Date.now();
        lockVault();
      } else if (nextState === 'active' && isScreenFocused && !isVaultUnlockedRef.current) {
        attemptUnlock();
      }
    };
    const subscription = AppState.addEventListener('change', handleAppState);
    return () => {
      subscription.remove();
    };
  }, [attemptUnlock, biometricLockEnabled, isScreenFocused, lockVault]);

  if (biometricLockEnabled && !isVaultUnlocked) {
    return (
      <View style={styles.lockScreen}>
        <View style={styles.lockIconWrapper}>
          <MaterialIcons name="lock" size={32} color="#9EE0FF" />
        </View>
        <Text style={styles.lockTitle}>Face ID required</Text>
        <Text style={styles.lockSubtitle}>
          For your security, the card vault stays hidden until you authenticate.
        </Text>
        {authError && <Text style={styles.lockError}>{authError}</Text>}
        <TouchableOpacity
          style={[
            styles.unlockButton,
            (!biometricsReady || authInFlight) && styles.unlockButtonDisabled,
          ]}
          onPress={attemptUnlock}
          disabled={!biometricsReady || authInFlight}
        >
          {authInFlight ? (
            <ActivityIndicator color="#050710" />
          ) : (
            <Text style={styles.unlockButtonText}>Unlock with Face ID</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroLabel}>Active Wallet</Text>
            <Text style={styles.heroTitle}>You have {cards.length} saved cards</Text>
            <Text style={styles.heroSubtitle}>Search, edit, or add new payment methods.</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddNew} hitSlop={20}>
            <MaterialIcons name="add" size={22} color="#050710" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color="rgba(255,255,255,0.5)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by nickname, holder, or digits"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={20}>
              <MaterialIcons name="close" size={18} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.cardStack}>
          {filteredCards.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No cards match that search</Text>
              <Text style={styles.emptySubtitle}>Try a different keyword or add a new card.</Text>
              <TouchableOpacity style={styles.emptyCta} onPress={handleAddNew}>
                <Text style={styles.emptyCtaText}>Add a card</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredCards.map((card) => (
              <View key={card.id} style={styles.cardWrapper}>
                <CreditCard {...card} onCopy={handleCopy} />
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleEdit(card.id)}
                    accessibilityLabel={`Edit ${card.description}`}
                    hitSlop={20}
                  >
                    <MaterialIcons name="edit" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Toast toastText={toastMessage} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#050710',
    marginTop: 50,
  },
  container: {
    padding: 24,
    paddingBottom: 140,
    gap: 18,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F1324',
    borderRadius: 28,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  heroTextBlock: {
    flex: 1,
    gap: 6,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.6,
    fontSize: 12,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 24,
    fontFamily: Fonts.rounded,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#A5F276',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B0F1E',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
  },
  cardStack: {
    gap: 18,
  },
  cardWrapper: {
    position: 'relative',
  },
  cardActions: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  emptyState: {
    backgroundColor: '#0F1324',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 10,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
  },
  emptyCta: {
    marginTop: 6,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  emptyCtaText: {
    color: '#fff',
    fontWeight: '600',
  },
  lockScreen: {
    flex: 1,
    backgroundColor: '#050710',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  lockIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(158,224,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(158,224,255,0.4)',
  },
  lockTitle: {
    color: '#fff',
    fontSize: 24,
    fontFamily: Fonts.rounded,
    textAlign: 'center',
  },
  lockSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  lockError: {
    color: '#FF6B6B',
    textAlign: 'center',
  },
  unlockButton: {
    marginTop: 12,
    width: '100%',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#9EE0FF',
  },
  unlockButtonDisabled: {
    opacity: 0.5,
  },
  unlockButtonText: {
    color: '#050710',
    fontWeight: '700',
    fontSize: 16,
  },
});
