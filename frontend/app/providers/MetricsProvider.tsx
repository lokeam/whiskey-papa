'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';

// Import the MetricsData type from the hook
export interface MetricsData {
  successRate: {
    value: number;
    total: number;
    succeeded: number;
    failed: number;
    status: 'healthy' | 'warning' | 'critical';
  };
  throughput: {
    value: number;
    unit: string;
  };
  queueDepth: {
    value: number;
    pending: number;
    queued: number;
    running: number;
    status: 'healthy' | 'warning';
  };
  avgDuration: {
    value: number;
    formatted: string;
  };
  lastUpdated: string;
}

// Define what the context provides
interface MetricsContextValue {
  metrics: MetricsData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

// Create a channel for passing data down the tree - throws error if absent and forces consumers to use the provider
const MetricsContext = createContext<MetricsContextValue | undefined>(undefined);

// Constants
const METRICS_API_URL = '/api/metrics';
const POLL_INTERVAL_MS = 30000;

interface MetricsProviderProps {
  children: ReactNode;
}


/**
 * MetricsProvider
 *
 * Manages metrics state for the entire application.
 * - Fetches metrics on mount
 * - Polls every 30 seconds
 * - Provides refresh() function for manual updates
 * - Prevents duplicate fetches
 */
export function MetricsProvider( { children }: MetricsProviderProps) {
  // State
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  //const [isFetching, setIsFetching] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = useRef<boolean>(false);


  // Fetch metrics fn - Core fetch logic, prevents duplicate simultaneous fetches
  const fetchMetrics = useCallback(async () => {
    // Prevent duplicate fetche
    if (isFetchingRef.current) {
      console.log('⏭️  Skipping fetch - already in progress');
      return;
    }

    isFetchingRef.current = true;

    try {
      const response = await fetch(METRICS_API_URL);

      if (!response.ok) {
        throw new Error(`HTTP error: ${response?.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 Metrics received:', {
        successRate: data.successRate,
        queueDepth: data.queueDepth,
        avgDuration: data.avgDuration,
      });

      setMetrics(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch metrics:', err);

      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Set up polling on mount to grab data every set polling interval and cleanup on unmount
  useEffect(() => {
    console.log('🚀 MetricsProvider mounted - starting polling');

    // Grab metrics
    fetchMetrics();

    // Set polling
    const interval = setInterval(fetchMetrics, POLL_INTERVAL_MS);

    // Cleanup
    return () => {
      console.log('🛑 MetricsProvider unmounting - stopping polling');
      clearInterval(interval);
    }
  }, [fetchMetrics]);


  // Public API for manual refresh - prevents infinite loop in side effect
  const manualRefresh = useCallback(() => {
    console.log('🔄 Manual metrics refresh triggered');

    fetchMetrics();
  }, [fetchMetrics]);


  // Performance - memoize context value, prevent unnecessary re-renders of consumers, only create new obj when deps change
  const memoizedContextValue = useMemo(() => ({
    metrics,
    isLoading,
    error,
    refresh: manualRefresh
  }), [metrics, isLoading, error, manualRefresh]);


  return (
    <MetricsContext.Provider value={memoizedContextValue}>
      {children}
    </MetricsContext.Provider>
  )
}

// useMetrics Hook - used to consume metrics from context, throws error if used outside of Metrics Provider
export function useMetrics(): MetricsContextValue {
  const context = useContext(MetricsContext);

  if (context === undefined) {
    throw new Error('useMetrics must be used with the MetricsProvider');
  }

  return context;
}
