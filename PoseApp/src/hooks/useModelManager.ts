import { useState, useEffect, useCallback } from 'react';
import { ModelManager, ModelConfig, ModelMetrics } from '../services/ModelManager';

export interface ModelState {
  model: ModelManager | null;
  loading: boolean;
  error: string | null;
  metrics: ModelMetrics | null;
  ready: boolean;
}

/**
 * React hook for managing TensorFlow Lite model lifecycle
 * Provides automatic initialization, error handling, and cleanup
 */
export function useModelManager(config: ModelConfig | null) {
  const [state, setState] = useState<ModelState>({
    model: null,
    loading: false,
    error: null,
    metrics: null,
    ready: false,
  });

  const initializeModel = useCallback(async (modelConfig: ModelConfig) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const modelManager = new ModelManager();
      const metrics = await modelManager.initialize(modelConfig);

      setState({
        model: modelManager,
        loading: false,
        error: null,
        metrics,
        ready: true,
      });

      return modelManager;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState({
        model: null,
        loading: false,
        error: errorMessage,
        metrics: null,
        ready: false,
      });
      throw error;
    }
  }, []);

  const dispose = useCallback(() => {
    if (state.model) {
      state.model.dispose();
      setState({
        model: null,
        loading: false,
        error: null,
        metrics: null,
        ready: false,
      });
    }
  }, [state.model]);

  // Auto-initialize when config is provided
  useEffect(() => {
    if (config && !state.model && !state.loading) {
      initializeModel(config).catch(error => {
        console.error('Auto-initialization failed:', error);
      });
    }
  }, [config, state.model, state.loading, initializeModel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.model) {
        state.model.dispose();
      }
    };
  }, []);

  return {
    ...state,
    initializeModel,
    dispose,
    runInference: state.model?.runInference.bind(state.model),
  };
}