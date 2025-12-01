'use client';

import React from 'react';

// Utils
import { cn } from '@/components/ui/utils';

// Icons
import { CheckCircleIcon } from '@/components/ui/logos/CheckCircleIcon';
import { SparklesIcon } from '@/components/ui/logos/SparklesIcon';
import { ClockIcon } from '@/components/ui/logos/ClockIcon';
import { BoltCircleDashedIcon } from '@/components/ui/logos/BoltCircleDashedIcon';

// Hooks
import { useMetrics } from '@/app/hooks/useMetrics';

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

export default function PlatformHealth() {
  const { metrics, isLoading, error } = useMetrics();

  // Show loading state
  if (isLoading) {
    return (
      <section className="col-span-full mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold">Platform Health</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border border-border rounded-lg p-6 bg-card animate-pulse">
              <div className="h-6 w-6 bg-muted rounded mb-4" />
              <div className="h-4 w-20 bg-muted rounded mb-2" />
              <div className="h-8 w-16 bg-muted rounded mb-2" />
              <div className="h-3 w-32 bg-muted rounded" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Show error state
  if (error || !metrics) {
    return (
      <section className="col-span-full mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold">Platform Health</h2>
        </div>
        <div className="border border-border rounded-lg p-6 bg-card text-center">
          <p className="text-muted-foreground">Failed to load metrics</p>
        </div>
      </section>
    );
  }

  // Extract metrics data
  const { successRate, queueDepth, avgDuration, throughput } = metrics;

  // Calculate freshness (data is fresh if updated within last 2 minutes)
  const lastUpdated = new Date(metrics.lastUpdated);
  const now = new Date();
  const ageMinutes = (now.getTime() - lastUpdated.getTime()) / 60000;
  const freshnessStatus: 'fresh' | 'stale' = ageMinutes < 2 ? 'fresh' : 'stale';

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
          metric={`${successRate.value}%`}
          description="Workflows completed successfully"
          legend={
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground">{successRate.succeeded} Success</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">{queueDepth.queued} Queued</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-muted-foreground">{successRate.failed} Failed</span>
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
          metric={avgDuration.formatted}
          description="Average workflow execution time"
        />

        {/* Throughput Card */}
        <MetricCard
          icon={<BoltCircleDashedIcon className="w-6 h-6 text-orange-500" />}
          title="Throughput"
          titleColor="text-orange-500"
          metric={`${throughput.value}`}
          description={`Workflows processed ${throughput.unit}`}
        />
      </div>
    </section>
  );
}
