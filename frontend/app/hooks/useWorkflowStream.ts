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
      console.error('❌ SSE error:', err);
      setWorkflowState(prev => ({ ...prev, error: 'Connection error', isConnected: false }));
      eventSource.close();
    };

    // Cleanup
    return () => {
      console.log('🔌 Closing SSE connection');
      eventSource.close();
    };
  }, [runId]);

  return workflowState;
}