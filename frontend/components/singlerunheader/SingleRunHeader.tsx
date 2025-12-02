'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/components/ui/utils';

// Icons
import { ChevronIcon } from '@/components/ui/logos/ChevronIcon';
import { CheckCircleDashedIcon } from '@/components/ui/logos/CheckCircleDashedIcon';
import { BoltCircleDashedIcon } from '@/components/ui/logos/BoltCircleDashedIcon';
import { XCircleIcon } from '@/components/ui/logos/XCircleIcon';
import { CircleOffIcon } from '@/components/ui/logos/CircleOffIcon';
import { ClockIcon } from '@/components/ui/logos/ClockIcon';

type WorkflowStatus = 'COMPLETED' | 'SUCCEEDED' | 'RUNNING' | 'FAILED' | 'CANCELLED' | 'QUEUED';

interface SingleRunHeaderProps {
  runId: string;
  workflowName: string;
  status: WorkflowStatus;
  triggeredAt: string;
  startedAt?: string;
  finishedAt?: string;
  duration: number; // in milliseconds
  totalSteps: number;
  completedSteps: number;
  onCopyConfig?: () => void;
  onViewWorkflow?: () => void;
  onReplay?: () => void;
  onCancel?: () => void;
}

// Status icon mapping
const STATUS_CONFIG = {
  COMPLETED: {
    icon: CheckCircleDashedIcon,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    label: 'Completed',
  },
  SUCCEEDED: {
    icon: CheckCircleDashedIcon,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    label: 'Succeeded',
  },
  RUNNING: {
    icon: BoltCircleDashedIcon,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    label: 'Running',
  },
  FAILED: {
    icon: XCircleIcon,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    label: 'Failed',
  },
  CANCELLED: {
    icon: CircleOffIcon,
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
    label: 'Cancelled',
  },
  QUEUED: {
    icon: ClockIcon,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    label: 'Queued',
  },
} as const;

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

export function SingleRunHeader({
  runId,
  workflowName,
  status,
  triggeredAt,
  startedAt,
  finishedAt,
  duration,
  totalSteps,
  completedSteps,
  onCopyConfig,
  onViewWorkflow,
  onReplay,
  onCancel,
}: SingleRunHeaderProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.QUEUED;
  const StatusIconComponent = config.icon;
  const canCancel = status === 'RUNNING' || status === 'QUEUED';

  return (
    <section className="col-span-full mb-8">
      {/* Header Container */}
      {/* border border-border bg-card */}
      <div className=" rounded-lg p-6 bg-[#B8D9FF]/3">
        {/* Top Row: Title and Actions */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{workflowName}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
              <span>Run ID: {runId}</span>
              <button
                onClick={() => copyToClipboard(runId)}
                className="px-2 py-1 text-xs border border-border rounded hover:bg-accent transition-colors"
                title="Copy Run ID"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {onCopyConfig && (
              <button
                onClick={onCopyConfig}
                className="px-3 py-2 text-sm border border-border rounded hover:bg-accent transition-colors flex items-center gap-2"
                title="Copy workflow configuration"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy Config
              </button>
            )}
            {onViewWorkflow && (
              <button
                onClick={onViewWorkflow}
                className="px-3 py-2 text-sm border border-border rounded hover:bg-accent transition-colors flex items-center gap-2"
                title="View workflow definition"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M12 1v6m0 6v6"></path>
                  <path d="M17 7l-5 5"></path>
                  <path d="M7 7l5 5"></path>
                </svg>
                Workflow
              </button>
            )}
            {onReplay && (
              <button
                onClick={onReplay}
                className="px-3 py-2 text-sm border border-border rounded hover:bg-accent transition-colors flex items-center gap-2"
                title="Replay this workflow run"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                  <path d="M21 3v5h-5"></path>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                </svg>
                Replay
              </button>
            )}
            {canCancel && onCancel && (
              <button
                onClick={onCancel}
                className="px-3 py-2 text-sm border border-red-500/50 text-red-500 rounded hover:bg-red-500/10 transition-colors flex items-center gap-2"
                title="Cancel this workflow run"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="m15 9-6 6m0-6 6 6"></path>
                </svg>
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Status Badge Row */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
          <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full', config.bgColor)}>
            <StatusIconComponent className={cn('w-4 h-4', config.color)} />
            <span className={cn('font-medium text-sm', config.color)}>{config.label}</span>
          </div>
          <span className="text-muted-foreground">•</span>
          <span className="text-sm font-medium">{formatDuration(duration)} total</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-sm text-muted-foreground">
            {completedSteps}/{totalSteps} steps {status === 'COMPLETED' || status === 'SUCCEEDED' ? 'succeeded' : 'completed'}
          </span>
        </div>

        {/* Metadata Row */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Triggered:</span>
            <span className="ml-2 font-medium">{formatTimestamp(triggeredAt)}</span>
          </div>
          {startedAt && (
            <div>
              <span className="text-muted-foreground">Started:</span>
              <span className="ml-2 font-medium">{formatTimestamp(startedAt)}</span>
            </div>
          )}
          {finishedAt && (
            <div>
              <span className="text-muted-foreground">Completed:</span>
              <span className="ml-2 font-medium">{formatTimestamp(finishedAt)}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
