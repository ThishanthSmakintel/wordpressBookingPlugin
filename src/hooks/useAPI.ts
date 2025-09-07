import { useState, useCallback } from 'react';

interface APIResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export const useAPI = <T>() => {
  const [state, setState] = useState<APIResponse<T>>({
    data: null,
    loading: false,
    error: null
  });

  const request = useCallback(async (url: string, options?: RequestInit) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
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
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Request failed';
      setState({ data: null, loading: false, error: errorMessage });
      throw error;
    }
  }, []);

  return { ...state, request };
};