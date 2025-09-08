import { useCallback } from 'react';
import { useBookingStore } from '../store/bookingStore';

export const useAPI = <T>() => {
  const { apiLoading, apiError, setApiLoading, setApiError } = useBookingStore();

  const request = useCallback(async (url: string, options?: RequestInit): Promise<T> => {
    setApiLoading(true);
    setApiError(null);
    
    try {
      const response = await fetch(`${window.bookingAPI?.root || '/wp-json/'}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': window.bookingAPI?.nonce || '',
          ...options?.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setApiLoading(false);
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Request failed';
      setApiError(errorMessage);
      setApiLoading(false);
      throw error;
    }
  }, [setApiLoading, setApiError]);

  return { request, loading: apiLoading, error: apiError };
};