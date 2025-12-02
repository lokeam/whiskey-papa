'use client';

import React, { useState } from 'react';
import { cn } from '@/components/ui/utils';

// Icons
import { CheckCircleDashedIcon } from '@/components/ui/logos/CheckCircleDashedIcon';
import { BoltCircleDashedIcon } from '@/components/ui/logos/BoltCircleDashedIcon';
import { XCircleIcon } from '@/components/ui/logos/XCircleIcon';
import { CircleOffIcon } from '@/components/ui/logos/CircleOffIcon';
import { ClockIcon } from '@/components/ui/logos/ClockIcon';

type StepStatus = 'COMPLETED' | 'SUCCEEDED' | 'RUNNING' | 'FAILED' | 'CANCELLED' | 'QUEUED' | 'PENDING';

interface WorkflowStep {
  id: string;
  name: string;
  status: StepStatus;
  duration?: number; // duration always in millisec
  startedAt?: string;
  finishedAt?: string;
  error?: string;
  isParallel?: boolean;
  parentGroup?: string;
}

interface ParallelGroup {
  name: string;
  steps: WorkflowStep[];
  totalDuration: number;
  slowestStep?: WorkflowStep;
}

interface SingleRunStepSectionProps {
  steps: WorkflowStep[];
  onRetry?: (stepId: string) => void;
  onViewLogs?: (stepId: string) => void;
  onViewDAG?: () => void;
  onViewWaterfall?: () => void;
  onDownloadLogs?: () => void;
}

// Status icon configuration
const STEP_STATUS_CONFIG = {
  COMPLETED: {
    icon: CheckCircleDashedIcon,
    color: 'text-green-500',
    label: '✓',
  },
  SUCCEEDED: {
    icon: CheckCircleDashedIcon,
    color: 'text-green-500',
    label: '✓',
  },
  RUNNING: {
    icon: BoltCircleDashedIcon,
    color: 'text-yellow-500',
    label: '●',
  },
  FAILED: {
    icon: XCircleIcon,
    color: 'text-red-500',
    label: '✗',
  },
  CANCELLED: {
    icon: CircleOffIcon,
    color: 'text-gray-500',
    label: '⊘',
  },
  QUEUED: {
    icon: ClockIcon,
    color: 'text-blue-500',
    label: '⏸',
  },
  PENDING: {
    icon: ClockIcon,
    color: 'text-gray-400',
    label: '⏸',
  },
} as const;

function formatDuration(ms: number): string {
  const seconds = (ms / 1000).toFixed(1);
  return `${seconds}s`;
}

/**
 * Groups parallel workflow steps together while preserving sequential step order.
 * Returns a mixed array of individual steps + parallel group objects.
 */
function groupParallelSteps(steps: WorkflowStep[]): (WorkflowStep | ParallelGroup)[] {
  const result: (WorkflowStep | ParallelGroup)[] = [];
  const parallelGroups = new Map<string, WorkflowStep[]>();

  // First pass: separate sequential workflow steps from parallel ones
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    // Throw sequential steps directly into result array
    if (!step.isParallel || !step.parentGroup) {
      result.push(step);
      continue;
    }

    // Group parallel steps by their parent group name
    const existingGroup = parallelGroups.get(step.parentGroup);
    if (existingGroup) {
      existingGroup.push(step);
    } else {
      parallelGroups.set(step.parentGroup, [step]);
    }
  }

  // Second pass: convert parallel groups into group objects and insert at correct position

  // Build a lookup table of original step positions for faster access
  const stepPositionMap = new Map<string, number>();
  for (let i = 0; i < steps.length; i++) {
    stepPositionMap.set(steps[i].id, i);
  }

  // Process each parallel group
  const groupEntries = Array.from(parallelGroups.entries());
  for (let i = 0; i < groupEntries.length; i++) {
    const [groupName, groupSteps] = groupEntries[i];

    // Find the longest-running step in this parallel group
    let totalDuration = 0;
    let slowestStep = groupSteps[0];

    for (let j = 0; j < groupSteps.length; j++) {
      const stepDuration = groupSteps[j].duration || 0;

      if (stepDuration > totalDuration) {
        totalDuration = stepDuration;
        slowestStep = groupSteps[j];
      }
    }

    // Create the parallel group payload obj
    const parallelGroup: ParallelGroup = {
      name: groupName,
      steps: groupSteps,
      totalDuration,
      slowestStep,
    };

    // Find where the first step of this group appeared in the original array
    const firstStepOriginalIndex = stepPositionMap.get(groupSteps[0].id) ?? -1;

    // If we can't find the above first step, append group to end
    if (firstStepOriginalIndex === -1) {
      result.push(parallelGroup);
      continue;
    }

    // Find the correct insertion point to maintain original step order
    let insertIndex = result.length;
    for (let k = 0; k < result.length; k++) {
      const item = result[k];

      // Only check sequential steps (parallel groups don't have 'id')
      if ('id' in item) {
        const itemOriginalIndex = stepPositionMap.get(item.id) ?? -1;

        // Insert before the first step that came after this group
        if (itemOriginalIndex >= firstStepOriginalIndex) {
          insertIndex = k;
          break;
        }
      }
    }

    // Insert the parallel group at the calculated position
    result.splice(insertIndex, 0, parallelGroup);
  }

  return result;
}

function StepRow({
  step,
  onRetry,
  onViewLogs,
  isIndented = false,
  showSlowestBadge = false,
}: {
  step: WorkflowStep;
  onRetry?: (stepId: string) => void;
  onViewLogs?: (stepId: string) => void;
  isIndented?: boolean;
  showSlowestBadge?: boolean;
}) {
  const config = STEP_STATUS_CONFIG[step.status] || STEP_STATUS_CONFIG.PENDING;
  const StatusIcon = config.icon;
  const canRetry = step.status === 'FAILED' || step.status === 'CANCELLED';

  return (
    <div className={cn(
      "flex items-center justify-between py-3 border-b border-border last:border-b-0",
      isIndented && "pl-6"
    )}>
      {/* Left: Status + Name + Duration */}
      <div className="flex items-center gap-3 flex-1">
        <StatusIcon className={cn("w-5 h-5", config.color)} />
        <span className="font-medium">{step.name}</span>
        {step.duration !== undefined && (
          <span className="text-sm text-muted-foreground">
            {formatDuration(step.duration)}
          </span>
        )}
        {showSlowestBadge && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 font-medium">
            ⚠️ Slowest
          </span>
        )}
        {step.error && (
          <span className="text-xs text-red-500 truncate max-w-xs" title={step.error}>
            {step.error}
          </span>
        )}
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-2">
        {canRetry && onRetry && (
          <button
            onClick={() => onRetry(step.id)}
            className="px-3 py-1 text-xs border border-border rounded hover:bg-accent transition-colors"
          >
            Retry
          </button>
        )}
        {onViewLogs && (
          <button
            onClick={() => onViewLogs(step.id)}
            className="px-3 py-1 text-xs border border-border rounded hover:bg-accent transition-colors"
          >
            Logs
          </button>
        )}
      </div>
    </div>
  );
}

function ParallelGroupSection({
  group,
  onRetry,
  onViewLogs,
}: {
  group: ParallelGroup;
  onRetry?: (stepId: string) => void;
  onViewLogs?: (stepId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border border-border/50 rounded-md my-2 bg-accent/5">
      {/* Group Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            {isExpanded ? '▼' : '▶'}
          </span>
          <span className="font-medium">
            Parallel Processing: {group.name}
          </span>
          <span className="text-sm text-muted-foreground">
            ({group.steps.length} steps, {formatDuration(group.totalDuration)} total)
          </span>
        </div>
      </button>

      {/* Group Steps */}
      {isExpanded && (
        <div className="px-4 pb-2">
          {group.steps.map(step => (
            <StepRow
              key={step.id}
              step={step}
              onRetry={onRetry}
              onViewLogs={onViewLogs}
              isIndented
              showSlowestBadge={step.id === group.slowestStep?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SingleRunStepSection({
  steps,
  onRetry,
  onViewLogs,
  onViewDAG,
  onViewWaterfall,
  onDownloadLogs,
}: SingleRunStepSectionProps) {
  const groupedSteps = groupParallelSteps(steps);

  return (
    <section className="col-span-full mb-8">
      <div className="border border-border rounded-lg bg-card">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-xl font-bold">Workflow Steps</h2>
        </div>

        {/* Steps List */}
        <div className="px-6 py-2">
          {groupedSteps.map((item, index) => {
            if ('steps' in item) {
              // Parallel group
              return (
                <ParallelGroupSection
                  key={`group-${item.name}`}
                  group={item}
                  onRetry={onRetry}
                  onViewLogs={onViewLogs}
                />
              );
            } else {
              // Regular step
              return (
                <StepRow
                  key={item.id}
                  step={item}
                  onRetry={onRetry}
                  onViewLogs={onViewLogs}
                />
              );
            }
          })}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border flex items-center gap-3">
          {onViewDAG && (
            <button
              onClick={onViewDAG}
              className="px-4 py-2 text-sm border border-border rounded hover:bg-accent transition-colors"
            >
              View DAG
            </button>
          )}
          {onViewWaterfall && (
            <button
              onClick={onViewWaterfall}
              className="px-4 py-2 text-sm border border-border rounded hover:bg-accent transition-colors"
            >
              View Waterfall
            </button>
          )}
          {onDownloadLogs && (
            <button
              onClick={onDownloadLogs}
              className="px-4 py-2 text-sm border border-border rounded hover:bg-accent transition-colors"
            >
              Download Logs
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
