import { useMemo } from 'react';

// Type for the resize function
type ResizeFunction = (frame: any, options: any) => ArrayBuffer;

interface ResizePluginResult {
  resize: ResizeFunction | null;
  isAvailable: boolean;
  error?: string;
}

/**
 * Safe hook to use the vision-camera-resize-plugin with proper error handling
 * Returns null if the plugin is not available or fails to initialize
 */
export function useSafeResizePlugin(): ResizePluginResult {
  return useMemo(() => {
    try {
      // Dynamically import the plugin
      const resizePluginModule = require('vision-camera-resize-plugin');
      const useResizePlugin = resizePluginModule.useResizePlugin;
      
      if (typeof useResizePlugin === 'function') {
        // Call the hook and return the result
        const pluginResult = useResizePlugin();
        return {
          resize: pluginResult?.resize || null,
          isAvailable: true,
        };
      } else {
        return {
          resize: null,
          isAvailable: false,
          error: 'useResizePlugin is not a function',
        };
      }
    } catch (error) {
      console.log('vision-camera-resize-plugin not available:', error);
      return {
        resize: null,
        isAvailable: false,
        error: String(error),
      };
    }
  }, []);
}

/**
 * Alternative hook that always returns null - for fallback-only mode
 */
export function useNoResizePlugin(): ResizePluginResult {
  return {
    resize: null,
    isAvailable: false,
  };
}