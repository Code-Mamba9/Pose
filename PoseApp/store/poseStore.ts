import { create } from 'zustand';
import type { PoseDetection, PostureAnalysis, PostureSession } from '@/types';

export interface PoseStoreState {
  currentPose: PoseDetection | null;
  currentAnalysis: PostureAnalysis | null;
  isAnalyzing: boolean;
  sessions: PostureSession[];
  activeSession: PostureSession | null;
}

export interface PoseStoreActions {
  setCurrentPose: (pose: PoseDetection | null) => void;
  setCurrentAnalysis: (analysis: PostureAnalysis | null) => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  startSession: (session: PostureSession) => void;
  endSession: () => void;
  addSession: (session: PostureSession) => void;
  clearSessions: () => void;
}

const initialState: PoseStoreState = {
  currentPose: null,
  currentAnalysis: null,
  isAnalyzing: false,
  sessions: [],
  activeSession: null,
};

export const usePoseStore = create<PoseStoreState & PoseStoreActions>((set, get) => ({
  ...initialState,
  
  setCurrentPose: (pose) => set({ currentPose: pose }),
  
  setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),
  
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  
  startSession: (session) => set({ 
    activeSession: session,
    isAnalyzing: true 
  }),
  
  endSession: () => {
    const { activeSession, sessions } = get();
    if (activeSession) {
      const endedSession = {
        ...activeSession,
        endTime: new Date(),
        duration: Date.now() - activeSession.startTime.getTime(),
      };
      set({
        sessions: [...sessions, endedSession],
        activeSession: null,
        isAnalyzing: false,
      });
    }
  },
  
  addSession: (session) => set((state) => ({
    sessions: [...state.sessions, session]
  })),
  
  clearSessions: () => set({ sessions: [] }),
}));