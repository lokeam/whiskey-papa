/**
 * useMetrics Hook
 *
 * Re-exports the useMetrics hook from MetricsProvider.
 * This maintains backward compatibility with existing imports.
 *
 * Usage:
 *   const { metrics, isLoading, error, refresh } = useMetrics();
 *
 * Must be used within a MetricsProvider.
 */
export { useMetrics, type MetricsData } from '@/app/providers/MetricsProvider';
