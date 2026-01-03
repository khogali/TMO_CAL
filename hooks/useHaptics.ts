import { useCallback } from 'react';

type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const hapticPatterns: Record<HapticFeedbackType, number | number[]> = {
    light: 10,
    medium: 30,
    heavy: 50,
    success: [50, 50, 50],
    warning: [100, 50, 100],
    error: [75, 50, 75, 50, 75],
};

export const useHaptics = () => {
    const triggerHaptic = useCallback((type: HapticFeedbackType = 'light') => {
        if ('vibrate' in navigator) {
            try {
                navigator.vibrate(hapticPatterns[type]);
            } catch (error) {
                console.warn("Haptic feedback failed.", error);
            }
        }
    }, []);

    return { triggerHaptic };
};
