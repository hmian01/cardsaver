import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme as t } from '@/constants/theme';
import { Icon } from './ui';

type FeedbackTone = 'success' | 'error';
type Feedback = (message: string, tone?: FeedbackTone) => void;

const FeedbackContext = createContext<Feedback>(() => {});
export const useFeedback = () => useContext(FeedbackContext);
export function FeedbackProvider({ children }: React.PropsWithChildren) {
  const [feedback, setFeedback] = useState<{
    message: string;
    tone: FeedbackTone;
  } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(28)).current;
  const insets = useSafeAreaInsets();
  const show = useCallback(
    (message: string, tone: FeedbackTone = 'success') => {
      if (timer.current) clearTimeout(timer.current);
      setFeedback({ message, tone });
      timer.current = setTimeout(() => setFeedback(null), 3000);
    },
    [],
  );
  useEffect(() => {
    if (!feedback) return;
    opacity.setValue(0);
    translateY.setValue(28);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [feedback, opacity, translateY]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <FeedbackContext.Provider value={show}>
      {children}
      {feedback ? (
        <Animated.View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={[
            styles.toast,
            feedback.tone === 'error' && styles.errorToast,
            {
              bottom: insets.bottom + 78,
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          <Icon
            name={feedback.tone === 'error' ? 'error-outline' : 'check-circle'}
            size={18}
            color={feedback.tone === 'error' ? t.danger : t.accent}
          />
          <Text style={styles.text}>{feedback.message}</Text>
        </Animated.View>
      ) : null}
    </FeedbackContext.Provider>
  );
}
const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    maxWidth: '90%',
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#303A2B',
    borderWidth: 1,
    borderColor: '#526246',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  errorToast: { borderColor: t.danger },
  text: { color: t.text, fontSize: 14, flexShrink: 1 },
});
