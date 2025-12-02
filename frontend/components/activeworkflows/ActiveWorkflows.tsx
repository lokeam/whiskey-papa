

import Link from "next/link";
import WorkflowHistoryItem from "@/components/recentrunslist/WorkflowHistoryItem";
import { EmptyStateCard } from "@/components/shared/EmptyStateCard";

// Types
import { WorkflowState } from "@/app/hooks/useWorkflowStream";

// Hooks
import { useElapsedTime } from '@/app/hooks/useElapsedTime';

// ============================================================================
// TODO: REFACTOR FOR PRODUCTION
// ============================================================================
// These transformation functions mix presentation logic with the component.
// For production, move to a dedicated adapter layer:
//
// 1. Create: /lib/adapters/workflowAdapter.ts
// 2. Export function: adaptWorkflowForUI(workflow: WorkflowState)
// 3. Move: mapStatus, formatTimeAgo, formatDuration to adapter
// 4. Component receives pre-formatted data
//
// Benefits:
// - Separation of concerns (data transformation vs rendering)
// - Testable in isolation
// - Reusable across components (RecentRunsList will need same logic)
// - Easier to mock for Storybook/tests
//
// Example refactor:
//   const adaptedWorkflows = workflows.map(adaptWorkflowForUI);
//   return <WorkflowHistoryItem {...adapted} />;
// ============================================================================

type ActiveWorkflowsProps = {
  workflows: WorkflowState[];
}

// Helper: Map Hatchet status to component status
const mapStatus = (status: string): 'running' | 'queued' | 'completed' | 'failed' | 'cancelled' => {
  const statusMap: Record<string, 'running' | 'queued' | 'completed' | 'failed' | 'cancelled'> = {
    'RUNNING': 'running',
    'QUEUED': 'queued',
    'COMPLETED': 'completed',
    'SUCCEEDED': 'completed',
    'FAILED': 'failed',
    'CANCELLED': 'cancelled',
  };
  return statusMap[status] || 'queued';
};

// Helper: Format time ago
const formatTimeAgo = (timestamp: string): string => {
  // Hatchet returns '0001-01-01T00:00:00Z' for workflows that haven't started yet
  if (!timestamp || timestamp === '0001-01-01T00:00:00Z') {
    return 'Just now';
  }

  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 0) return 'Just now'; // Handle future timestamps
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// Helper: Format duration
const formatDuration = (durationMs: number): string => {
  if (durationMs < 0) return '0s'; // Handle invalid durations

  const seconds = Math.floor(durationMs / 1000);
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

// Component for individual workflow with live timer
function ActiveWorkflowItem({ workflow }: { workflow: WorkflowState }) {
  const isRunning = workflow.status === 'RUNNING' || workflow.status === 'QUEUED';
  const elapsedMs = useElapsedTime(workflow.startedAt, isRunning);

  return (
    <WorkflowHistoryItem
      key={workflow.runId}
      variant="active"
      status={mapStatus(workflow.status)}
      title={workflow.workflowName}
      description={`#${workflow.runId.slice(0, 8)}`}
      triggeredAtLabel={formatTimeAgo(workflow.startedAt)}
      durationLabel={formatDuration(elapsedMs)}
      runId={workflow.runId}
    />
  );
}

export default function ActiveWorkflows({ workflows }: ActiveWorkflowsProps) {
  return (
    <section className="col-span-full mb-8">
      {/* Header*/}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-bold">ACTIVE WORKFLOWS</h2>
        </div>
        <div>
          <Link href="/runs">View all</Link>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
       {workflows.length === 0 ? (
          <EmptyStateCard
            key="empty-active-workflows"
            icon="ACTIVE_WORKFLOWS"
            title="You have no active workflows"
            description="Workflow runs will appear here once they are executed."
          />
          ) : (
            workflows.map((workflow) => (
              <ActiveWorkflowItem key={workflow.runId} workflow={workflow} />
            ))
        )}
      </div>
    </section>
  )
}