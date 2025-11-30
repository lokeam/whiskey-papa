import React from 'react';
import Link from 'next/link';
import { cn } from '@/components/ui/utils';
import { CheckCircleIcon } from '@/components/ui/logos/CheckCircleIcon';
import { SparklesIcon } from '@/components/ui/logos/SparklesIcon';
import { ClockIcon } from '@/components/ui/logos/ClockIcon';
import { PlayIcon } from '@/components/ui/logos/PlayIcon';

export type RunStatus = 'running' | 'succeeded' | 'failed';

export interface RunStep {
  id: string;
  name: string;
  durationMs: number;
}

export interface Run {
  id: string;
  workflowName: string;
  status: RunStatus;
  startedAt: string;
  durationMs: number;
  steps: RunStep[];
  retries?: number;
  worker?: string;
  queue?: string;
}

type MetricCardProps = {
  icon: React.ReactNode;
  title: string;
  titleColor?: string;
  metric: string;
  description: string;
  legend?: React.ReactNode;
};

function MetricCard({ icon, title, titleColor, metric, description, legend }: MetricCardProps) {
  return (
    <div className="flex flex-col gap-4 border border-border rounded-lg p-6 bg-card">
      {/* Icon */}
      <div className="w-6 h-6">
        {icon}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2">
        <h3 className={cn("text-lg font-medium", titleColor)}>
          {title}
        </h3>
        <div className="text-2xl font-bold text-foreground">
          {metric}
        </div>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>

      {/* Optional Legend */}
      {legend && (
        <div className="pt-2 border-t border-border">
          {legend}
        </div>
      )}
    </div>
  );
}

type PlatformHealthProps = {
  runs: Run[];
}

export default function PlatformHealth({ runs }: PlatformHealthProps) {
  // Calculate metrics from runs data
  const totalRuns = runs.length;
  const successfulRuns = runs.filter(r => r.status === 'succeeded').length;
  const failedRuns = runs.filter(r => r.status === 'failed').length;
  const runningRuns = runs.filter(r => r.status === 'running').length;

  const successRate = totalRuns > 0 ? ((successfulRuns / totalRuns) * 100).toFixed(1) : '0.0';

  // Calculate average duration
  const avgDurationMs = totalRuns > 0
    ? runs.reduce((sum, run) => sum + run.durationMs, 0) / totalRuns
    : 0;
  const avgDurationMinutes = Math.floor(avgDurationMs / 60000);
  const avgDurationSeconds = Math.floor((avgDurationMs % 60000) / 1000);
  const avgDuration = `${avgDurationMinutes}m ${avgDurationSeconds}s`;

  // Mock freshness status (TODO: replace with actual logic)
  const freshnessStatus: 'fresh' | 'stale' = 'fresh';

  // Mock jobs processed (TODO: replace with actual logic)
  const jobsProcessed = 128;

  return (
    <section className="col-span-full mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-3xl font-bold">Platform Health</h2>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Success Rate Card */}
        <MetricCard
          icon={<CheckCircleIcon className="w-6 h-6 text-green-500" />}
          title="Success Rate"
          titleColor="text-green-500"
          metric={`${successRate}%`}
          description="Workflows completed successfully"
          legend={
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground">{successfulRuns} Success</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">{runningRuns} Queued</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-muted-foreground">{failedRuns} Failed</span>
              </div>
            </div>
          }
        />

        {/* Freshness Card */}
        <MetricCard
          icon={<SparklesIcon className="w-6 h-6 text-purple-500" />}
          title="Freshness"
          titleColor="text-purple-500"
          metric={freshnessStatus === 'fresh' ? 'Fresh' : 'Stale'}
          description="Data quality status"
          legend={
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-green-500 font-medium">Fresh</span>
                <span className="text-muted-foreground">Updated recently</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-red-500 font-medium">Stale</span>
                <span className="text-muted-foreground">Needs update</span>
              </div>
            </div>
          }
        />

        {/* Duration Card */}
        <MetricCard
          icon={<ClockIcon className="text-blue-500" />}
          title="Avg Duration"
          titleColor="text-blue-500"
          metric={avgDuration}
          description="Average workflow execution time"
        />

        {/* Jobs Processed Card */}
        <MetricCard
          icon={<PlayIcon className="w-6 h-6 text-orange-500" />}
          title="Jobs Processed"
          titleColor="text-orange-500"
          metric={jobsProcessed.toString()}
          description="In last 24 hours"
        />
      </div>
    </section>
  );
}
