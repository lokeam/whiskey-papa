
// Types for Workflow Runs status

// Union type for autocomplete, typechecking + self documentation
export type WorkflowRunStatus =
  | 'PENDING'    // Queued, waiting to start
  | 'RUNNING'    // Currently executing
  | 'SUCCEEDED'  // Completed successfully
  | 'COMPLETED'  // Completed (Hatchet uses this)
  | 'FAILED'     // Failed (after all retries)
  | 'CANCELLED'; // User cancelled


// Refactor for above's 'WorkflowRunStatus'. Individual steps have more granular states than entire workflow runs
export type StepStatus =
  | 'QUEUED'
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED';

export type LogLevel =
  | 'INFO'
  | 'SUCCESS'
  | 'WARN'
  | 'ERROR'
  | 'DEBUG';

export interface ActivityLogEvent {
  id: string;
  timestamp: string; // ISO 8601 timestamp
  level: LogLevel;
  message: string;
  stepId?: string;
  stepName?: string;
}

// Individual steps within a workflow run
export interface WorkflowStep {
  id: string;
  name: string;
  status: StepStatus;
  duration?: number;       // Total duration (queue + run)
  queueTime?: number;      // Time spent in queue (ms)
  runTime?: number;        // Time spent running (ms)
  createdAt?: string;      // ISO 8601 timestamp - when task was created
  startedAt?: string;      // ISO 8601 timestamp - when execution started
  finishedAt?: string;     // ISO 8601 timestamp - when execution finished
  error?: string;
  isParallel?: boolean;
  parentGroup?: string;
}

// Used in Activity Log for tasks run in parallel
export interface ParallelGroup {
  name: string;
  steps: WorkflowStep[];
  totalDuration: number; // Marks the duration of the slowest step
  slowestStep?: WorkflowStep;
}

// Internal endpoint response
export interface RunResponse {
  // SingleRunHeader component usage
  runId: string;
  workflowName: string;
  status: string;
  triggeredAt: string;
  startedAt?: string;
  finishedAt?: string;
  duration: number;
  totalSteps: number;
  completedSteps: number;

  // SingleRunStepSection component usage
  steps: WorkflowStep[];

  // Activity logs (for SingleRunActivityLog component)
  activityLogs: ActivityLogEvent[];
}



// Complete workflow run data
export interface WorkflowRun {
  id: string;                    // Hatchet workflow run ID
  workflowName: string;          // e.g., "document:process"
  status: WorkflowRunStatus;
  startedAt: string;             // ISO 8601 timestamp
  finishedAt?: string;           // ISO 8601 timestamp
  durationMs?: number;
  steps: WorkflowStep[];
  metadata?: {
    triggeredBy?: string;        // Who/what triggered this
    input?: Record<string, unknown>; // Original input data
  };
}

// Request body for triggering a workflow
export interface TriggerWorkflowRequest {
  workflowName: string;          // Which workflow to trigger
  input: Record<string, unknown>; // Input data for the workflow
}

// Response from triggering a workflow
export interface TriggerWorkflowResponse {
  success: boolean;
  workflowRunId: string;         // Use this to track the run
  message?: string;
}

// Response from listing workflow runs
export interface ListWorkflowRunsResponse {
  runs: WorkflowRun[];
  total: number;
  // Future: Add pagination fields
  // page?: number;
  // pageSize?: number;
}

