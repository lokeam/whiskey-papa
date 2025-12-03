/**
 * Platform Health Metrics API Route
 *
 * GET /api/metrics
 *
 * Aggregates real-time platform health metrics from Hatchet Cloud:
 * - Success Rate: Percentage of completed vs failed workflows (last 100 runs)
 * - Queue Depth: Current pending/queued/running workflow counts
 * - Average Duration: Mean execution time for completed workflows
 * - Throughput: Workflows completed in the last hour
 *
 * Data Sources:
 * - hatchet.admin.runs.list() - Recent workflow run history
 * - hatchet.metrics.getQueueMetrics() - Current queue state
 *
 * Caching: Disabled (force-dynamic) for real-time metrics
 * Polling: Frontend polls every 30s via useMetrics() hook
 *
 * @returns JSON with success rate, queue depth, avg duration, throughput
 */

import { NextResponse } from 'next/server';
import { getHatchetClient } from '@/lib/hatchet/client';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Extend TenantQueueMetrics with actual structure from API
interface QueueMetricsResponse {
  total?: {
    numPending?: number;
    numQueued?: number;
    numRunning?: number;
  };
  queues?: Record<string, unknown>;
  workflow?: Record<string, unknown>;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}



export async function GET() {
  try {
    const hatchet = getHatchetClient();

    // Get all recent runs (tenant-wide)
    const runsResponse = await hatchet.admin.runs.list({ limit: 100 });
    const runs = runsResponse.rows || [];

    // Calculate aggregate metrics from runs
    const total = runs.length;
    // Note: Hatchet uses 'COMPLETED' for successful runs, not 'SUCCEEDED'
    const succeeded = runs.filter((r) => {
      const status = r.status?.toString().toUpperCase();
      return status === 'COMPLETED' || status === 'SUCCEEDED';
    }).length;
    const failed = runs.filter((r) => r.status?.toString().toUpperCase() === 'FAILED').length;
    const successRate = total > 0 ? (succeeded / total) * 100 : 0;

    // Calculate average duration from completed runs
    const completedRuns = runs.filter((r) => r.finishedAt && r.startedAt);
    const avgDuration = completedRuns.length > 0
      ? completedRuns.reduce((sum: number, r) => {
          const duration = new Date(r.finishedAt!).getTime() - new Date(r.startedAt!).getTime();
          return sum + duration;
        }, 0) / completedRuns.length
      : 0;

    // Calculate throughput (workflows completed in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCompletedRuns = completedRuns.filter((r) => {
      const finishedAt = new Date(r.finishedAt!);
      return finishedAt >= oneHourAgo;
    });
    const throughputPerHour = recentCompletedRuns.length;

    // Get queue metrics
    const queueMetrics = await hatchet.metrics.getQueueMetrics() as QueueMetricsResponse;

    // Extract queue totals from actual API structure
    const queueTotal = queueMetrics?.total || {};
    const numPending = queueTotal.numPending || 0;
    const numQueued = queueTotal.numQueued || 0;
    const numRunning = queueTotal.numRunning || 0;
    const totalQueueDepth = numPending + numQueued;

    return NextResponse.json({
      successRate: {
        value: Math.round(successRate * 10) / 10,
        total,
        succeeded,
        failed,
        status: successRate >= 90 ? 'healthy' : successRate >= 75 ? 'warning' : 'critical'
      },
      throughput: {
        value: throughputPerHour,
        unit: 'per hour',
      },
      queueDepth: {
        value: totalQueueDepth,
        pending: numPending,
        queued: numQueued,
        running: numRunning,
        status: totalQueueDepth > 20 ? 'warning' : 'healthy',
      },
      avgDuration: {  // ← Add this whole object
        value: Math.round(avgDuration / 1000),
        formatted: formatDuration(avgDuration),
      },
      lastUpdated: new Date().toISOString(),
        })

  } catch (err) {
    console.error('Failed to fetch metrics:', err);

    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
