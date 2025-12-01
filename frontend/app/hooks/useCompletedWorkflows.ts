import { useEffect, useState } from 'react';
import { WorkflowState } from '@/app/hooks/useWorkflowStream';

const STORAGE_KEY = 'whiskey-papa-completed-workflows';

const getInitialWorkflows = (): WorkflowState[] => {
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
  const [completedWorkflows, setCompletedWorkflows] = useState<WorkflowState[]>(getInitialWorkflows);

  // Poll localStorage every 2 seconds to catch updates
  useEffect(() => {
    const interval = setInterval(() => {
      const updated = getInitialWorkflows();

      setCompletedWorkflows(updated);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return completedWorkflows;
}