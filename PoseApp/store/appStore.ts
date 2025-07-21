import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface AppStoreState {
  theme: 'light' | 'dark' | 'auto';
  isOnboardingComplete: boolean;
  appVersion: string;
  lastSessionDate: Date | null;
}

export interface AppStoreActions {
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  completeOnboarding: () => void;
  updateLastSessionDate: () => void;
  resetApp: () => void;
}

const initialState: AppStoreState = {
  theme: 'auto',
  isOnboardingComplete: false,
  appVersion: '1.0.0',
  lastSessionDate: null,
};

export const useAppStore = create<AppStoreState & AppStoreActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setTheme: (theme) => set({ theme }),
      
      completeOnboarding: () => set({ isOnboardingComplete: true }),
      
      updateLastSessionDate: () => set({ lastSessionDate: new Date() }),
      
      resetApp: () => set(initialState),
    }),
    {
      name: 'pose-app-storage',
      storage: createJSONStorage(() => 
        Platform.OS === 'web' ? localStorage : AsyncStorage
      ),
      partialize: (state) => ({
        theme: state.theme,
        isOnboardingComplete: state.isOnboardingComplete,
        lastSessionDate: state.lastSessionDate,
      }),
    }
  )
);