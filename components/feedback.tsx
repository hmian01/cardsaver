import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme as t } from '@/constants/theme';
import { Icon } from './ui';

const FeedbackContext = createContext<(message: string) => void>(() => {});
export const useFeedback = () => useContext(FeedbackContext);
export function FeedbackProvider({ children }: React.PropsWithChildren) {
  const [message, setMessage] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const show = useCallback((text: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(text);
    timer.current = setTimeout(() => setMessage(''), 3000);
  }, []);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <FeedbackContext.Provider value={show}>
      {children}
      {message ? (
        <View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={[styles.toast, { bottom: insets.bottom + 78 }]}
        >
          <Icon name="check-circle" size={18} color={t.accent} />
          <Text style={styles.text}>{message}</Text>
        </View>
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
  text: { color: t.text, fontSize: 14, flexShrink: 1 },
});
