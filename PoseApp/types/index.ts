// Global type definitions for the Pose app

export interface PoseKeypoint {
  x: number;
  y: number;
  confidence: number;
}

export interface PoseDetection {
  keypoints: PoseKeypoint[];
  confidence: number;
  timestamp: number;
}

export interface PostureAnalysis {
  spinalCurvature: number;
  shoulderAlignment: number;
  hipPositioning: number;
  overallScore: number;
  recommendations: string[];
}

export interface User {
  id: string;
  name: string;
  email?: string;
  profilePicture?: string;
  createdAt: Date;
}

export interface PostureSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  analysis: PostureAnalysis;
  poseData: PoseDetection[];
}

// Navigation types
export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  Analysis: { sessionId: string };
  Settings: undefined;
};

// Store types
export interface AppState {
  user: User | null;
  currentSession: PostureSession | null;
  isAnalyzing: boolean;
  theme: 'light' | 'dark' | 'auto';
}