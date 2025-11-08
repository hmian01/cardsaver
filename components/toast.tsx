import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';

type ToastProps = {
  toastText: string;
};

const TOAST_OFFSET = 120;

export default function Toast({ toastText }: ToastProps) {
  const translateY = useRef(new Animated.Value(TOAST_OFFSET)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visible, setVisible] = useState(false);
  const visibilityRef = useRef(false);

  useEffect(() => {
    visibilityRef.current = visible;
  }, [visible]);

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const hideToast = (options?: { immediate?: boolean }) => {
    const { immediate } = options ?? {};
    const finish = () => {
      setVisible(false);
      translateY.setValue(TOAST_OFFSET);
      clearTimer();
    };

    if (!visibilityRef.current || immediate) {
      finish();
      return;
    }

    Animated.timing(translateY, {
      toValue: TOAST_OFFSET,
      duration: 220,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(finish);
  };

  useEffect(() => {
    if (!toastText) {
      hideToast({ immediate: true });
      return undefined;
    }

    setVisible(true);
    Animated.timing(translateY, {
      toValue: 0,
      duration: 260,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    clearTimer();
    timer.current = setTimeout(() => hideToast(), 3000);

    return () => clearTimer();
  }, [toastText, translateY]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      <Text style={styles.text}>{toastText}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 24,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(10, 10, 15, 0.95)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
    borderWidth: 1.5,
    borderColor: '#507aafff',
  },
  text: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
