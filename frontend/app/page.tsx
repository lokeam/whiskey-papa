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
import { WorkflowState } from '@/app/hooks/useWorkflowStream';
import { useCompletedWorkflows } from '@/app/hooks/useCompletedWorkflows';
import { useMetrics } from '@/app/hooks/useMetrics';

const TRIGGER_WORKFLOW_API = '/api/workflows/trigger';
const DOCUMENT_PROCESSING_PIPELINE = 'document-processing-pipeline';
const INVOICE_PROCESSING_PIPELINE = 'invoice-processing-pipeline';

const STORAGE_KEY = 'whiskey-papa-completed-workflows';
const MAX_HISTORY = 20;

// Helper: Save completed workflow to localStorage
const saveCompletedWorkflow = (workflow: WorkflowState) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const existing: WorkflowState[] = stored ? JSON.parse(stored) : [];

    // Check if workflow already exists
    if (existing.some(w => w.runId === workflow.runId)) {
      return;
    }

    // Add to front, keep last MAX_HISTORY
    const updated = [workflow, ...existing].slice(0, MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    console.log('💾 Saved completed workflow to localStorage:', workflow.runId);
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
};

// Force dynamic rendering to avoid hydration mismatch with localStorage
export const dynamic = 'force-dynamic';

export default function Home() {
  // Track multiple active run IDs
  const [activeRunIds, setActiveRunIds] = useState<string[]>([]);
  const completedWorkflows = useCompletedWorkflows();
  const { refresh: refreshMetrics } = useMetrics();

  // Track workflow states for all active runs
  const [workflowStates, setWorkflowStates] = useState<Record<string, WorkflowState>>({});

  // Set up SSE listeners for all active workflows
  useEffect(() => {
    const eventSources: Record<string, EventSource> = {};
    const queueTimeouts: Record<string, NodeJS.Timeout> = {};
    const QUEUE_TIMEOUT_MS = 30000; // 30 seconds

    activeRunIds.forEach(runId => {
      console.log('🔌 Opening SSE connection for run:', runId);
      const eventSource = new EventSource(`/api/workflows/stream/${runId}`);
      eventSources[runId] = eventSource;

      eventSource.onopen = () => {
        console.log('✅ SSE connection opened for:', runId);
      };

      eventSource.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          console.log('📨 Received event for', runId, ':', event);

          setWorkflowStates(prev => ({
            ...prev,
            [runId]: event.payload
          }));

          const status = event.payload.status;

          // If workflow moves from QUEUED to RUNNING, clear the timeout
          if (status === 'RUNNING' && queueTimeouts[runId]) {
            clearTimeout(queueTimeouts[runId]);
            delete queueTimeouts[runId];
          }

          // If workflow is QUEUED and we haven't set a timeout yet, set one
          if (status === 'QUEUED' && !queueTimeouts[runId]) {
            // Capture the current workflow state in the closure
            const workflowSnapshot = event.payload;

            queueTimeouts[runId] = setTimeout(() => {
              console.warn(
                `⚠️ Workflow ${runId} has been QUEUED for ${QUEUE_TIMEOUT_MS / 1000}s.\n` +
                `No worker appears to be running. Please start the worker and try again.`
              );

              // Save as failed workflow to localStorage using the snapshot
              console.log('💾 Workflow snapshot for timeout:', workflowSnapshot);

              // Calculate duration properly
              // Hatchet returns '0001-01-01T00:00:00Z' for workflows that never started
              let durationMs = QUEUE_TIMEOUT_MS; // Default to timeout duration (30s)
              let actualStartedAt = workflowSnapshot.startedAt;

              if (workflowSnapshot.startedAt && workflowSnapshot.startedAt !== '0001-01-01T00:00:00Z') {
                // Valid timestamp - calculate actual duration
                const startTime = typeof workflowSnapshot.startedAt === 'string'
                  ? new Date(workflowSnapshot.startedAt).getTime()
                  : workflowSnapshot.startedAt;
                durationMs = Date.now() - startTime;
              } else {
                // Zero timestamp from Hatchet - workflow never actually started
                // Create a reasonable startedAt by subtracting timeout duration from now
                actualStartedAt = new Date(Date.now() - QUEUE_TIMEOUT_MS).toISOString();
                console.log('⚠️ Workflow never started (zero timestamp), using estimated time');
              }

              const failedWorkflow: WorkflowState = {
                runId: workflowSnapshot.runId || runId,
                status: 'FAILED',
                workflowName: workflowSnapshot.workflowName || 'Unknown',
                startedAt: actualStartedAt,
                finishedAt: new Date().toISOString(),
                duration: durationMs,
                error: 'Workflow timed out - no worker available',
                isConnected: false,
              };

              console.log('💾 Saving failed workflow:', failedWorkflow);
              saveCompletedWorkflow(failedWorkflow);

              // Trigger custom event to force useCompletedWorkflows to refresh
              window.dispatchEvent(new Event('workflowCompleted'));

              // Remove from active workflows
              setActiveRunIds(prev => prev.filter(id => id !== runId));
              setWorkflowStates(prev => {
                const updated = { ...prev };
                delete updated[runId];
                return updated;
              });
            }, QUEUE_TIMEOUT_MS);
          }

          // Check if workflow completed
          if (['COMPLETED', 'SUCCEEDED', 'FAILED', 'CANCELLED'].includes(status)) {
            console.log('🔄 Workflow completed, refreshing metrics...');

            // Clear queue timeout if it exists
            if (queueTimeouts[runId]) {
              clearTimeout(queueTimeouts[runId]);
              delete queueTimeouts[runId];
            }

            // Save completed workflow to localStorage
            // Use event.payload (fresh data) instead of workflowStates (might be stale)
            if (event.payload) {
              console.log('💾 Saving completed workflow:', event.payload);
              saveCompletedWorkflow(event.payload as WorkflowState);
              window.dispatchEvent(new Event('workflowCompleted'));
            }

            setTimeout(() => refreshMetrics(), 1000);

            // Remove from active list after delay
            setTimeout(() => {
              setActiveRunIds(prev => prev.filter(id => id !== runId));
              setWorkflowStates(prev => {
                const updated = { ...prev };
                delete updated[runId];
                return updated;
              });
            }, 2000);
          }
        } catch (err) {
          console.error('Failed to parse SSE event:', err);
        }
      };

      eventSource.onerror = () => {
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log('🔌 SSE connection closed for:', runId);
        }
        if (eventSource.readyState !== EventSource.CLOSED) {
          eventSource.close();
        }
      };
    });

    // Cleanup
    return () => {
      Object.entries(eventSources).forEach(([runId, eventSource]) => {
        console.log('🔌 Closing SSE connection for:', runId);
        eventSource.close();
      });

      // Clear all queue timeouts
      Object.values(queueTimeouts).forEach(timeout => clearTimeout(timeout));
    };
  }, [activeRunIds, refreshMetrics]);

  // Convert workflow states to array for ActiveWorkflows component
  const activeWorkflows = activeRunIds
    .map(runId => workflowStates[runId])
    .filter(state => state && (state.status === 'QUEUED' || state.status === 'RUNNING'));


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
        setActiveRunIds(prev => [...prev, data.workflowRunId]);
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
        setActiveRunIds(prev => [...prev, data.workflowRunId]);
      }
    } catch (err) {
      console.error('Failed to trigger workflow:', err);
    }
  }

  return (
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
  );
}
