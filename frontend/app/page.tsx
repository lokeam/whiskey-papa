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

const TRIGGER_WORKFLOW_API = '/api/workflows/trigger';
const DOCUMENT_PROCESSING_PIPELINE = 'document-processing-pipeline';
const INVOICE_PROCESSING_PIPELINE = 'invoice-processing-pipeline';

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


  const handleTriggerDAGWorkflow = async () => {
    try {
      const res = await fetch(TRIGGER_WORKFLOW_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowName: DOCUMENT_PROCESSING_PIPELINE,
          input: { documentId: `demo-${Date.now()}` }
        })
      });

      const data = await res.json();

      if (data.success) {
        console.log('✅ Workflow triggered:', data.workflowRunId);
        setRunId(data.workflowRunId);
      }
    } catch (err) {
      console.error('Failed to trigger workflow:', err);
    }
  };

  const handleTriggerInvoiceWorkflow = async () => {
    try {
      const res = await fetch(TRIGGER_WORKFLOW_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowName: INVOICE_PROCESSING_PIPELINE,
          input: { documentId: `demo-${Date.now()}` }
        })
      });

      const data = await res.json();

      if (data.success) {
        console.log('✅ Workflow triggered:', data.workflowRunId);
        setRunId(data.workflowRunId);
      }
    } catch (err) {
      console.error('Failed to trigger workflow:', err);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-background">
      <PageMain>
        <div className="flex flex-row gap-4">
          <button
            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded cursor-pointer"
            onClick={handleTriggerDAGWorkflow}
            >
              Trigger DAG Success Workflow
          </button>
          <button
            className="mb-4 px-4 py-2 bg-red-800 text-white rounded cursor-pointer"
            onClick={handleTriggerInvoiceWorkflow}
            >
              Trigger DAG Fail Workflow
          </button>
        </div>
        <PageGrid>

          <PlatformHealth />
          <ActiveWorkflows workflows={activeWorkflows} />
          <RecentRunsList runs={completedWorkflows} />

        </PageGrid>
      </PageMain>
    </div>
  );
}
