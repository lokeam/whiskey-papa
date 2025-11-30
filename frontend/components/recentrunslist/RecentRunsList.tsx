import Link from 'next/link';

import WorkflowHistoryItem from '@/components/recentrunslist/WorkflowHistoryItem';
import { EmptyStateCard } from '@/components/shared/EmptyStateCard';

export type RunStatus = 'running' | 'succeeded' | 'failed';

export interface RunStep {
  id: string;
  name: string;
  durationMs: number;
}

export interface Run {
  id: string;
  workflowName: string;
  status: RunStatus;
  startedAt: string;
  durationMs: number;
  steps: RunStep[];
  retries?: number;
  worker?: string;
  queue?: string;
}

type RecentRunsProps = {
  runs: Run[];
}

export default function RecentRunsList({ runs }: RecentRunsProps) {
  return (
    <section className="col-span-full">
      {/* Header*/}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">Recent Workflow Runs</h2>
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
          {runs.map((runItem) => (
            <WorkflowHistoryItem
              key={runItem?.id}
              variant="recent"
              status={runItem.status as 'running' | 'completed' | 'failed' | 'cancelled' | 'queued'}
              title={runItem.workflowName}
              description={`${runItem.steps.length} steps`}
                triggeredAtLabel={new Date(runItem.startedAt).toLocaleString()}
                durationLabel={`${Math.floor(runItem.durationMs / 1000)}s`}
              />
          ))}
        </div>
      )}
    </section>
  )
}
