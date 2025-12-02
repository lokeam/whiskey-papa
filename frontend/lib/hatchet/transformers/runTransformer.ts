import { WorkflowStep, ActivityLogEvent, RunResponse, StepStatus } from '@/lib/hatchet/types';
import { extractStepName, mapEventTypeToLogLevel } from '@/lib/hatchet/utils';
import { detectParallelGroups } from '@/lib/hatchet/transformers/parallelStepDetector';



/**
 * Maps Hatchet task status to our StepStatus type
 */
function mapTaskStatusToStepStatus(status: string): StepStatus {
  const statusMap: Record<string, StepStatus> = {
    'PENDING': 'PENDING',
    'RUNNING': 'RUNNING',
    'SUCCEEDED': 'SUCCEEDED',
    'COMPLETED': 'COMPLETED',
    'FAILED': 'FAILED',
    'CANCELLED': 'CANCELLED'
  };

  return statusMap[status] || 'PENDING';
}

interface HatchetTask {
  metadata?: { id: string };
  taskName?: string;
  status: string;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
}

interface HatchetTaskEvent {
  id?: string;
  timeFirstSeen?: string;
  type: string;
  message?: string;
  reason?: string;
  stepId?: string;
  stepName?: string;
}

interface HatchetRun {
  metadata?: { id: string; createdAt: string };
  displayName?: string;
  status: string;
  startedAt?: string;
  finishedAt?: string;
  duration?: number;
}

interface HatchetShapeItem {
  stepId: string;
  taskName: string;
  taskExternalId: string;
  childrenStepIds: string[];
}

interface HatchetResponse {
  run: HatchetRun;
  tasks?: HatchetTask[];
  taskEvents?: HatchetTaskEvent[];
  shape?: HatchetShapeItem[];
}

/**
 * Transforms raw Hatchet API response into our frontend data structure.
 *
 * Takes: Raw Hatchet data (run, tasks, taskEvents, shape)
 * Returns: Clean data ready for UI components
 */
export function transformRawRunData(hatchetResponse: HatchetResponse): RunResponse {
  const { run, tasks, taskEvents, shape } = hatchetResponse;

  // Determine which steps run in parallel
  const parallelStepMap = detectParallelGroups(shape || []);

  // Transform tasks into WorkflowStep objs
  const workflowSteps: WorkflowStep[] = (tasks || []).map((task) => {
    const stepId = task.metadata?.id || '';
    const workflowStep = parallelStepMap.get(stepId);

    return {
      id: stepId,
      name: extractStepName(task.taskName || ''),
      status: mapTaskStatusToStepStatus(task.status),
      duration: task.finishedAt && task.startedAt
        ? new Date(task.finishedAt).getTime() - new Date(task.startedAt).getTime()
        : undefined,
      startedAt: task.startedAt,
      finishedAt: task.finishedAt,
      error: task.error,
      isParallel: workflowStep?.isParallel || false,
      parentGroup: workflowStep?.groupName,
    };
  });

  // Transform taskEvents into ActivityLogEvents
  const activityLogEvents: ActivityLogEvent[] = (taskEvents || []).map((event) => ({
    id: event.id || '',
    timestamp: event.timeFirstSeen || new Date().toISOString(),
    level: mapEventTypeToLogLevel(event.type),
    message: event.message || event.reason || event.type,
    stepId: event.stepId,
    stepName: event.stepName ? extractStepName(event.stepName) : ''
  }));

  // Assemble RunResponse payload
  return {
    runId: run.metadata?.id || '',
    workflowName: run.displayName || 'Unknown workflow',
    status: run.status,
    triggeredAt: run.metadata?.createdAt || new Date().toISOString(),
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    duration: run.duration || 0,
    totalSteps: workflowSteps.length,
    completedSteps: workflowSteps.filter(s => s.status === 'COMPLETED' || s.status === 'SUCCEEDED').length,
    steps: workflowSteps,
    activityLogs: activityLogEvents,
  }
}
