'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

// Layout Items
import { PageMain } from "@/components/layout/page-main";
import { PageGrid } from "@/components/layout/page-grid";

// Custom components
import { SingleRunHeader } from "@/components/singlerunheader/SingleRunHeader";
import { SingleRunStepSection } from "@/components/singlerunstepsection/SingleRunStepSection";
import { SingleRunActivityLog } from "@/components/singlerunactivitylog/SingleRunActivityLog";

// Shared types
import { RunResponse } from '@/lib/hatchet/types';

export default function IndividualRunPage() {
  const params = useParams();
  const runId = params.id as string;

  const [runData, setRunData] = useState<RunResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRunData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/workflows/runs/${runId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch run data');
        }

        const data: RunResponse = await response.json();
        setRunData(data);
      } catch (err) {
        console.error('Error fetching run:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    if (runId) {
      fetchRunData();
    }
  }, [runId]);

  if (loading) {
    return (
      <PageMain>
        <PageGrid>
          <div className="col-span-full flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading workflow run...</p>
          </div>
        </PageGrid>
      </PageMain>
    );
  }

  if (error || !runData) {
    return (
      <PageMain>
        <PageGrid>
          <div className="col-span-full flex items-center justify-center py-12">
            <p className="text-red-500">Error: {error || 'No data found'}</p>
          </div>
        </PageGrid>
      </PageMain>
    );
  }

  return (
    <PageMain>
      <PageGrid>
        <SingleRunHeader
          runId={runData.runId}
          workflowName={runData.workflowName}
          status={runData.status as any}
          triggeredAt={runData.triggeredAt}
          startedAt={runData.startedAt}
          finishedAt={runData.finishedAt}
          duration={runData.duration}
          totalSteps={runData.totalSteps}
          completedSteps={runData.completedSteps}
          onCopyConfig={() => console.log('Copy Config')}
          onViewWorkflow={() => console.log('View Workflow')}
          onReplay={() => console.log('Replay Workflow')}
          onCancel={() => console.log('Cancel Workflow')}
        />

        <SingleRunStepSection
          steps={runData.steps}
          onRetry={(stepId) => console.log('Retry', stepId)}
          onViewLogs={(stepId) => console.log('View logs', stepId)}
          onViewDAG={() => console.log('View DAG')}
          onViewWaterfall={() => console.log('View Waterfall')}
          onDownloadLogs={() => console.log('Download logs')}
        />

        <SingleRunActivityLog
          events={runData.activityLogs}
          autoScroll={true}
          maxHeight="32rem"
        />
      </PageGrid>
    </PageMain>
  );
}
