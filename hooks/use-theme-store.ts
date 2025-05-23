import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { useEffect } from 'react';

type ThemeState = {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  resolvedTheme: 'light' | 'dark';
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      resolvedTheme: 'light', // Default, will be updated based on system or preference
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Hook to use in components that need the theme
export function useTheme() {
  const systemColorScheme = useColorScheme();
  const { theme, setTheme, resolvedTheme } = useThemeStore();
  
  useEffect(() => {
    // Update the resolved theme based on the selected theme
    if (theme === 'system') {
      useThemeStore.setState({ 
        resolvedTheme: systemColorScheme === 'dark' ? 'dark' : 'light' 
      });
    } else {
      useThemeStore.setState({ resolvedTheme: theme });
    }
  }, [theme, systemColorScheme]);

  return {
    theme,
    setTheme,
    isDark: resolvedTheme === 'dark',
  };
}