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
  stepId?: string;
  actionId?: string;
  status: string;
  createdAt?: string;
  taskInsertedAt?: string;  // When task was inserted into queue
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
    const taskId = task.metadata?.id || '';
    const stepId = task.stepId || '';
    const workflowStep = parallelStepMap.get(stepId);

    // Calculate timing metrics
    // Use taskInsertedAt (when task entered queue) instead of createdAt (which is often 0001-01-01)
    const queuedTime = task.taskInsertedAt ? new Date(task.taskInsertedAt).getTime() : null;
    const startedTime = task.startedAt ? new Date(task.startedAt).getTime() : null;
    const finishedTime = task.finishedAt ? new Date(task.finishedAt).getTime() : null;

    const queueTime = queuedTime && startedTime ? startedTime - queuedTime : undefined;
    const runTime = startedTime && finishedTime ? finishedTime - startedTime : undefined;
    const totalDuration = queuedTime && finishedTime ? finishedTime - queuedTime : undefined;

    return {
      id: taskId,
      name: extractStepName(task.actionId || ''),
      status: mapTaskStatusToStepStatus(task.status),
      duration: totalDuration,
      queueTime,
      runTime,
      createdAt: task.taskInsertedAt,  // Use taskInsertedAt as the creation time
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
