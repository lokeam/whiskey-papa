
import React from 'react';
import { CircleOffIcon } from "@/components/ui/logos/CircleOffIcon";
import { TimeDurationOffIcon } from "@/components/ui/logos/TimeDurationOffIcon";

type EmptyStateIcon = 'ACTIVE_WORKFLOWS' | 'RECENT_RUNS';

interface EmptyStateCardProps {
  icon: EmptyStateIcon;
  title: string;
  description: string;
}

const EMPTY_ICONS = {
  ACTIVE_WORKFLOWS: TimeDurationOffIcon,
  RECENT_RUNS: CircleOffIcon
} as const;

export function EmptyStateCard({ icon, title, description }: EmptyStateCardProps) {

  const Icon = EMPTY_ICONS[icon];

  return (
    <div className="flex flex-col items-center justify-center border border-border rounded-lg py-12 px-16">
      {/* Icon */}
      <div className="mb-6">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>

      {/* Text Content */}
      <div className="flex flex-col gap-2 text-center">
        <h3 className="text-base font-medium text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
