'use client';

import React, { useState } from 'react';
import { cn } from '@/components/ui/utils';
import { WorkflowStep, ParallelGroup } from '@/lib/hatchet/types';

// Icons
import { CheckCircleDashedIcon } from '@/components/ui/logos/CheckCircleDashedIcon';
import { BoltCircleDashedIcon } from '@/components/ui/logos/BoltCircleDashedIcon';
import { XCircleIcon } from '@/components/ui/logos/XCircleIcon';
import { CircleOffIcon } from '@/components/ui/logos/CircleOffIcon';
import { ClockIcon } from '@/components/ui/logos/ClockIcon';

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
 * Steps are already marked with isParallel and parentGroup by the transformer.
 */
function groupParallelSteps(steps: WorkflowStep[]): (WorkflowStep | ParallelGroup)[] {
  const result: (WorkflowStep | ParallelGroup)[] = [];
  const groupMap = new Map<string, WorkflowStep[]>();
  const groupIndices = new Map<string, number>();  // Track where each group is in result array

  console.log('=== GROUPING PARALLEL STEPS ===');
  console.log('Total steps:', steps.length);
  console.log('Steps with isParallel:', steps.filter(s => s.isParallel).length);

  for (const step of steps) {
    if (step.isParallel) {
      console.log('Parallel step found:', step.name, 'Group:', step.parentGroup, 'Duration:', step.duration);
    }
    // Sequential step - add directly
    if (!step.isParallel || !step.parentGroup) {
      result.push(step);
      continue;
    }

    // Parallel step - collect in group
    if (!groupMap.has(step.parentGroup)) {
      groupMap.set(step.parentGroup, []);

      // Create placeholder group on first encounter
      const groupIndex = result.length;
      groupIndices.set(step.parentGroup, groupIndex);
      result.push({
        name: step.parentGroup,
        steps: [],  // Will be filled below
        totalDuration: 0,
        slowestStep: undefined,
      });
    }

    groupMap.get(step.parentGroup)!.push(step);
  }

  // Second pass: calculate slowest step for each group now that all steps are collected
  for (const [groupName, groupSteps] of groupMap.entries()) {
    let maxDuration = 0;
    let slowest = groupSteps[0];

    for (const s of groupSteps) {
      const stepDuration = s.runTime || s.duration || 0;  // Use runTime for parallel comparison
      if (stepDuration > maxDuration) {
        maxDuration = stepDuration;
        slowest = s;
      }
    }

    // Update the group in the result array
    const groupIndex = groupIndices.get(groupName)!;
    result[groupIndex] = {
      name: groupName,
      steps: groupSteps,
      totalDuration: maxDuration,
      slowestStep: slowest,
    };
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
      <div className="flex items-center gap-24 flex-1">
        <StatusIcon className={cn("w-5 h-5", config.color)} />
        <span className="font-medium min-w-[140px]">{step.name}</span>
        {(step.queueTime !== undefined || step.runTime !== undefined) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {step.queueTime !== undefined && (
              <span className="flex items-center gap-1">
                <span className="opacity-60 text-sm">⏱️</span>
                <span>{formatDuration(step.queueTime)}</span>
              </span>
            )}
            {step.queueTime !== undefined && step.runTime !== undefined && (
              <span className="opacity-40">|</span>
            )}
            {step.runTime !== undefined && (
              <span className="flex items-center gap-1">
                <span className="scale-200 text-yellow-500 mr-1.5">⚡</span>
                <span>{formatDuration(step.runTime)}</span>
              </span>
            )}
          </div>
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
// bg-accent/5
  return (
    <div className="border border-navy rounded-md my-2">
      {/* Group Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/10 transition-colors"
      >
        <div className="flex items-center gap-12">
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
      {/* border border-border bg-card */}
      <div className="border border-border rounded-lg bg-[#B8D9FF]/3">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-xl font-bold">Workflow Steps</h2>
        </div>

        {/* Steps List */}
        <div className="px-6 py-2">
          {groupedSteps.map((item) => {
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
