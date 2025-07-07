import { useState, useCallback } from 'react';
import { executeWithRetry, logError, classifyError } from '../lib/errorHandling';

export const useErrorHandler = () => {
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleError = useCallback((error, context = {}) => {
    console.error('Error occurred:', error, context);
    
    // エラーログを送信
    logError(error, context);
    
    // エラー状態を設定
    setError(error);
  }, []);

  const executeWithErrorHandling = useCallback(async (
    fn, 
    options = {}
  ) => {
    const { 
      maxRetries = 3, 
      delay = 1000,
      context = {},
      onSuccess,
      onError 
    } = options;

    try {
      setError(null);
      const result = await executeWithRetry(fn, maxRetries, delay);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (error) {
      handleError(error, context);
      
      if (onError) {
        onError(error);
      }
      
      throw error;
    }
  }, [handleError]);

  const retry = useCallback(async (fn, options = {}) => {
    if (!fn) return;
    
    setIsRetrying(true);
    try {
      await executeWithErrorHandling(fn, options);
    } finally {
      setIsRetrying(false);
    }
  }, [executeWithErrorHandling]);

  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  const createErrorHandler = useCallback((context = {}) => {
    return (error) => handleError(error, context);
  }, [handleError]);

  return {
    error,
    isRetrying,
    handleError,
    executeWithErrorHandling,
    retry,
    dismissError,
    createErrorHandler,
    isRetryable: error ? classifyError(error).isRetryable : false
  };
}; 