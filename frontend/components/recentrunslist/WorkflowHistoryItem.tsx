import React from 'react';
import { cn } from '@/components/ui/utils';

import { BoltCircleDashedIcon } from '@/components/ui/logos/BoltCircleDashedIcon';
import { XIcon } from '@/components/ui/logos/XIcon';
import { CheckCircleDashedIcon } from '@/components/ui/logos/CheckCircleDashedIcon';
import { XCircleIcon } from '@/components/ui/logos/XCircleIcon';
import { QueuedLogo } from '@/components/ui/logos/QueuedLogo';
import { ClockIcon } from '@/components/ui/logos/ClockIcon';

type WorkflowStatus = 'completed' | 'running' | 'failed' | 'cancelled' | 'queued';

type WorkflowHistoryItemProps = {
  status: WorkflowStatus;
  title: string;
  description: string;
  triggeredAtLabel: string;
  durationLabel: string;
  variant?: 'recent' | 'active';
};

const STATUS_ICONS = {
  running: BoltCircleDashedIcon,
  failed: XIcon,
  completed: CheckCircleDashedIcon,
  cancelled: XCircleIcon,
  queued: QueuedLogo,
} as const;


function StatusIcon({ status, variant }: { status: WorkflowStatus; variant?: 'recent' | 'active' }) {
  const colorClass = {
    completed: 'text-green-500',
    running: 'text-yellow-500',
    failed: 'text-red-500',
    cancelled: 'text-gray-500',
    queued: 'text-amber-500',
  }[status];

  const Icon = STATUS_ICONS[status];

  const iconClasses = cn(
    'h-8 w-8 rounded-full',
    colorClass,
    variant === 'active' && status === 'running' && 'animate-pulse-ring'
  );

  return <Icon className={iconClasses} />;
}

// Small single use calendar icon for the right side
function CalendarIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="h-6 w-6"
    >
      <rect x="3" y="4" width="14" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 3v3M13 3v3M3 7h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}


export default function WorkflowHistoryItem({
  status,
  title,
  description,
  triggeredAtLabel,
  durationLabel,
  variant = 'recent',
}: WorkflowHistoryItemProps) {
  const containerClasses = cn(
    'flex items-center justify-between gap-4 rounded-md px-4 py-3 text-sm cursor-pointer',
    variant === 'recent' && 'bg-transparent border border-border text-foreground',
    variant === 'active' && 'bg-navy text-foreground animate-pulse-subtle'
  );

  return (
    <article className={containerClasses}>
      {/* Left: status icon + text */}
      <div className="flex min-w-0 items-start gap-3">
        <StatusIcon status={status} variant={variant} />
        <div className="min-w-0">
          <h3 className="truncate text-lg font-medium pb-1">{title} &bull; {variant === 'active' && <span className="text-xs text-yellow-500">RUNNING</span>}</h3>
          <p className="truncate text-xs text-neutral-400">workflow: {description}</p>
        </div>
      </div>

      {/* Right: time + duration */}
      <div className="flex shrink-0 items-center gap-4 text-xs text-neutral-400">
        <div className="flex items-center gap-1">
          <CalendarIcon />
          <span>{triggeredAtLabel}</span>
        </div>
        <div className="flex items-center gap-1">
          <ClockIcon />
          <span>{durationLabel}</span>
        </div>
      </div>
    </article>
  );
}
