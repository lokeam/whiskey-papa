'use client';

import { useState, useEffect } from 'react';

// Layout Items
import { PageMain } from "@/components/layout/page-main";
import { PageGrid } from "@/components/layout/page-grid";

// Custom componets
import PlatformHealth from "@/components/platformhealth/PlatformHealth";
import ActiveWorkflows from "@/components/activeworkflows/ActiveWorkflows";
import RecentRunsList from "@/components/recentrunslist/RecentRunsList";

// Hooks
import { useWorkflowStream } from '@/app/hooks/useWorkflowStream';
import { useCompletedWorkflows } from '@/app/hooks/useCompletedWorkflows';
import { useMetrics } from '@/app/hooks/useMetrics';


export default function Home() {
  const [runId, setRunId] = useState<string | null>(null);
  const workflowState = useWorkflowStream(runId);
  const completedWorkflows = useCompletedWorkflows();

  const { refresh: refreshMetrics } = useMetrics();

  // Compute derived state
  const activeWorkflows = workflowState.runId &&
    (workflowState.status === 'QUEUED' || workflowState.status === 'RUNNING')
      ? [workflowState]
      : [];

  // Refresh metrics when workflow completes
  useEffect(() => {
    const isCompleted = ['COMPLETED', 'SUCCEEDED', 'FAILED', 'CANCELLED'].includes(workflowState.status);

    if (isCompleted && workflowState.runId) {
      console.log('🔄 Workflow completed, refreshing metrics...');

      setTimeout(() => refreshMetrics(), 1000);
    }
  }, [workflowState.status, workflowState.runId, refreshMetrics]);


  const handleTriggerTestWorkflow = async () => {
    try {
      const res = await fetch('/api/workflows/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowName: 'document-processing-pipeline',
          input: { documentId: `demo-${Date.now()}` }
        })
      });

      const data = await res.json();

      if (data.success) {
        console.log('✅ Workflow triggered:', data.workflowRunId);
        setRunId(data.workflowRunId); // ← This starts streaming!
      }
    } catch (err) {
      console.error('Failed to trigger workflow:', err);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-background">
      <PageMain>
          <button
            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded cursor-pointer"
            onClick={handleTriggerTestWorkflow}
            >
              Trigger Test Workflow
          </button>
        <PageGrid>

          <PlatformHealth />
          <ActiveWorkflows workflows={activeWorkflows} />
          <RecentRunsList runs={completedWorkflows} />

        </PageGrid>
      </PageMain>
    </div>
  );
}
