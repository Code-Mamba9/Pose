// Utility functions for the Pose app
import Constants from 'expo-constants';

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
};

export const asyncDelay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};


export const generateAPIUrl = (relativePath: string) => {
  // const origin = "http://localhost:8081"
  const origin = "http://192.168.18.78:8081";

  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

  if (process.env.NODE_ENV === 'development') {
    return origin.concat(path);
  }

  if (!process.env.EXPO_PUBLIC_API_BASE_URL) {
    throw new Error(
      'EXPO_PUBLIC_API_BASE_URL environment variable is not defined',
    );
  }
  return process.env.EXPO_PUBLIC_API_BASE_URL.concat(path);
};
// Permission management exports
export * from './PermissionManager';



