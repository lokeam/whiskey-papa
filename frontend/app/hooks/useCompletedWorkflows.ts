/**
 * Completed Workflows Hook
 *
 * Manages persistent workflow history via localStorage.
 *
 * Storage Key: 'whiskey-papa-completed-workflows'
 * Max History: 20 runs (managed by save logic in page.tsx)
 *
 * Update Mechanisms:
 * - Polling: Checks localStorage every 2s for updates
 * - Event Listener: Responds to 'workflowCompleted' custom events
 * - SSR Safe: Returns empty array during server-side rendering
 *
 * Used by: RecentRunsList component on dashboard
 *
 * @returns Array of completed WorkflowState objects from localStorage
 */

import { useEffect, useState } from 'react';
import { WorkflowState } from '@/app/hooks/useWorkflowStream';

const STORAGE_KEY = 'whiskey-papa-completed-workflows';

const getInitialWorkflows = (): WorkflowState[] => {
  // Only access localStorage on the client
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const storedWorkflows = localStorage.getItem(STORAGE_KEY);
    if (storedWorkflows) {
      const parsed = JSON.parse(storedWorkflows);

      console.log('📦 Loaded', parsed.length, 'completed workflows');

      return parsed;
    }
  } catch (err) {
    console.error('Failed to load from localStorage:', err);
  }

  return [];
}

export function useCompletedWorkflows() {
  const [completedWorkflows, setCompletedWorkflows] = useState<WorkflowState[]>(() => getInitialWorkflows());

  useEffect(() => {
    // Refresh function
    const refresh = () => {
      const updated = getInitialWorkflows();
      setCompletedWorkflows(updated);
    };

    // Poll localStorage every 2 seconds to catch updates
    const interval = setInterval(refresh, 2000);

    // Listen for custom event when workflows are saved
    window.addEventListener('workflowCompleted', refresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('workflowCompleted', refresh);
    };
  }, []);

  return completedWorkflows;
}