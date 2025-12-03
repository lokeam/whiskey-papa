/**
 * Workflow Stream Hook
 *
 * Manages real-time workflow status updates via Server-Sent Events (SSE).
 *
 * Connection Flow:
 * 1. Opens EventSource to /api/workflows/stream/[runId]
 * 2. Receives STATUS_UPDATE events every 1s (server polls Hatchet)
 * 3. Updates React state with latest workflow status
 * 4. On completion (COMPLETED/FAILED/CANCELLED):
 *    - Saves to localStorage (max 20 runs)
 *    - Closes SSE connection
 *
 * Event Types:
 * - STATUS_UPDATE: Workflow status changed (QUEUED → RUNNING → COMPLETED)
 * - ERROR: Connection or parsing error
 *
 * Auto-Reconnection: Browser EventSource API handles reconnection automatically
 *
 * Used by: Dashboard page for live workflow monitoring
 *
 * @param runId - Workflow run ID to stream, or null to skip connection
 * @returns WorkflowState with current status, timestamps, and connection state
 */

import { useEffect, useState } from 'react';

interface WorkflowEvent {
  type: 'STATUS_UPDATE' | 'ERROR';
  payload: {
    runId: string;
    status: string;
    workflowName: string;
    startedAt: string;
    finishedAt?: string;
    duration?: number;
  };
}

export interface WorkflowState {
  runId: string;
  status: string;
  workflowName: string;
  startedAt: string;
  finishedAt: string;
  duration: number;
  error: string | null;
  isConnected: boolean;
}

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

export function useWorkflowStream(runId: string | null) {
  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    runId: '',
    status: 'PENDING',
    workflowName: '',
    startedAt: '',
    finishedAt: '',
    duration: 0,
    error: null,
    isConnected: false,
  });

  useEffect(() => {
    if (!runId) return;

    console.log('🔌 Opening SSE connection for run:', runId);

    const eventSource = new EventSource(`/api/workflows/stream/${runId}`);

    // Create handlers - onopen
    eventSource.onopen = () => {
      console.log('✅ SSE connection opened');
      setWorkflowState(prev => ({ ...prev, isConnected: true }));
    };

    // Create handlers - onmessage
    eventSource.onmessage = (e) => {
      try {
        const event: WorkflowEvent = JSON.parse(e.data);
        console.log('📨 Received event:', event);

        switch (event.type) {
          case 'ERROR':
            setWorkflowState(prev => ({
              ...prev,
              error: event.payload as unknown as string,
            }));
            break;

          case 'STATUS_UPDATE':
            setWorkflowState(prev => {
              const updated = {
                ...prev,
                ...event.payload,
              };

              // If workflow completed, save to localStorage
              const isCompleted = ['COMPLETED', 'SUCCEEDED', 'FAILED', 'CANCELLED']
                .includes(updated.status);

              if (isCompleted && updated.runId) {
                saveCompletedWorkflow(updated);
              }

              return updated;
            });
            break;

          default:
            console.warn('Unknown event type:', event.type);
        }
      } catch (err) {
        console.error('Failed to parse SSE event:', err);
      }
    };

    // Create handlers - onerror
    eventSource.onerror = (err) => {
      // EventSource errors don't provide useful details, check readyState
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log('🔌 SSE connection closed by server (workflow likely completed)');

        setWorkflowState(prev => ({ ...prev, isConnected: false }));
      } else if (eventSource.readyState === EventSource.CONNECTING) {
        console.log('🔄 SSE reconnecting...');
      } else {
        console.error('❌ SSE connection error');

        setWorkflowState(prev => ({
          ...prev,
          error: 'Connection error',
          isConnected: false
        }));
      }

      // Close if not already closed
      if (eventSource.readyState !== EventSource.CLOSED) {
        eventSource.close();
      }
    };

    // Cleanup
    return () => {
      console.log('🔌 Closing SSE connection');
      eventSource.close();
    };
  }, [runId]);

  return workflowState;
}