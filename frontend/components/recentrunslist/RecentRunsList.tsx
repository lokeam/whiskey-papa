'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import WorkflowHistoryItem from '@/components/recentrunslist/WorkflowHistoryItem';
import { EmptyStateCard } from '@/components/shared/EmptyStateCard';
import { WorkflowState } from '@/app/hooks/useWorkflowStream';

type RecentRunsProps = {
  runs: WorkflowState[];
};

// TODO: Move to adapter layer in production
// Helper functions to transform WorkflowState to UI format
const mapStatus = (status: string): 'completed' | 'running' | 'failed' | 'cancelled' | 'queued' => {
  const statusMap: Record<string, 'completed' | 'running' | 'failed' | 'cancelled' | 'queued'> = {
    'COMPLETED': 'completed',
    'SUCCEEDED': 'completed',
    'RUNNING': 'running',
    'FAILED': 'failed',
    'CANCELLED': 'cancelled',
    'QUEUED': 'queued',
  };
  return statusMap[status] || 'queued';
};

const formatTimeAgo = (timestamp: string): string => {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);

  return date.toLocaleString();
};

const formatDuration = (startedAt: string, finishedAt?: string, duration?: number): string => {
  if (duration) {
    return `${Math.floor(duration / 1000)}s`;
  }
  if (finishedAt && startedAt) {
    const start = new Date(startedAt).getTime();
    const end = new Date(finishedAt).getTime();
    const durationMs = end - start;

    return `${Math.floor(durationMs / 1000)}s`;
  }
  return 'N/A';
};

export default function RecentRunsList({ runs }: RecentRunsProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // Prevent hydration mismatch by showing empty state until mounted
  if (!isMounted) {
    return (
      <section className="col-span-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">RECENT WORKFLOW RUNS</h2>
          </div>
          <div>
            <Link href="/runs">View all</Link>
          </div>
        </div>
        <EmptyStateCard
          key="empty-recent-runs"
          icon="RECENT_RUNS"
          title="No recent workflow runs"
          description="Workflow runs will appear here once they are executed."
        />
      </section>
    );
  }

  return (
    <section className="col-span-full">
      {/* Header*/}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">RECENT WORKFLOW RUNS</h2>
        </div>
        <div>
          <Link href="/runs">View all</Link>
        </div>
      </div>

      {/* List */}
      {runs.length === 0 ? (
        <EmptyStateCard
          key="empty-recent-runs"
          icon="RECENT_RUNS"
          title="No recent workflow runs"
          description="Workflow runs will appear here once they are executed."
        />
      ) : (
        <div className="space-y-4">
          {runs.map((workflow) => (
            <WorkflowHistoryItem
              key={workflow.runId}
              variant="recent"
              status={mapStatus(workflow.status)}
              title={workflow.workflowName}
              description={`Completed at ${formatTimeAgo(workflow.finishedAt)}`}
              triggeredAtLabel={formatTimeAgo(workflow.startedAt)}
              durationLabel={formatDuration(workflow.startedAt, workflow.finishedAt, workflow.duration)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
