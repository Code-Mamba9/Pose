import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { User } from '@/types';

export interface UserStoreState {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
}

export interface UserStoreActions {
  setUser: (user: User) => void;
  signOut: () => void;
  setGuestMode: (isGuest: boolean) => void;
}

const initialState: UserStoreState = {
  user: null,
  isAuthenticated: false,
  isGuest: true,
};

export const useUserStore = create<UserStoreState & UserStoreActions>()(
  persist(
    (set) => ({
      ...initialState,
      
      setUser: (user) => set({ 
        user, 
        isAuthenticated: true, 
        isGuest: false 
      }),
      
      signOut: () => set({ 
        user: null, 
        isAuthenticated: false, 
        isGuest: true 
      }),
      
      setGuestMode: (isGuest) => set({ isGuest }),
    }),
    {
      name: 'pose-user-storage',
      storage: createJSONStorage(() => 
        Platform.OS === 'web' ? localStorage : AsyncStorage
      ),
    }
  )
);