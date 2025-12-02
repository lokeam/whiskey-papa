'use client';

import { useState, useEffect } from 'react';

// Layout Items
import { PageMain } from "@/components/layout/page-main";
import { PageGrid } from "@/components/layout/page-grid";

// Custom componets
import { SingleRunHeader } from "@/components/singlerunheader/SingleRunHeader";
import { SingleRunStepSection } from "@/components/singlerunstepsection/SingleRunStepSection";
import { SingleRunActivityLog } from "@/components/singlerunactivitylog/SingleRunActivityLog";

type StepStatus = 'COMPLETED' | 'SUCCEEDED' | 'RUNNING' | 'FAILED' | 'CANCELLED' | 'QUEUED' | 'PENDING';

interface WorkflowStep {
  id: string;
  name: string;
  status: StepStatus;
  duration?: number;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
  isParallel?: boolean;
  parentGroup?: string;
}

const mockSteps: WorkflowStep[] = [
  { id: '1', name: 'upload', status: 'COMPLETED', duration: 2800 },
  { id: '2', name: 'validate', status: 'COMPLETED', duration: 2800 },
  { id: '3', name: 'extract', status: 'COMPLETED', duration: 3800 },

  // Parallel group
  { id: '4', name: 'parse-tables', status: 'COMPLETED', duration: 3800, isParallel: true, parentGroup: 'parsing' },
  { id: '5', name: 'parse-text', status: 'COMPLETED', duration: 3800, isParallel: true, parentGroup: 'parsing' },
  { id: '6', name: 'parse-images', status: 'COMPLETED', duration: 4800, isParallel: true, parentGroup: 'parsing' },

  { id: '7', name: 'transform', status: 'COMPLETED', duration: 2800 },
  { id: '8', name: 'store-database', status: 'FAILED', duration: 2800, error: 'Connection timeout' },
  { id: '9', name: 'notify', status: 'PENDING' },
];

const mockActivityLogs = [
  { id: '1', timestamp: '2023-01-01T00:00:00.123Z', level: 'INFO' as const, message: 'Workflow triggered by user@example.com' },
  { id: '2', timestamp: '2023-01-01T00:00:01.456Z', level: 'INFO' as const, message: 'Allocated worker: worker-node-3' },
  { id: '3', timestamp: '2023-01-01T00:00:02.789Z', level: 'INFO' as const, message: 'Starting step: upload', stepId: '1', stepName: 'upload' },
  { id: '4', timestamp: '2023-01-01T00:00:03.012Z', level: 'INFO' as const, message: 'Uploading file to S3: document.pdf (2.4 MB)', stepId: '1', stepName: 'upload' },
  { id: '5', timestamp: '2023-01-01T00:00:04.345Z', level: 'SUCCESS' as const, message: 'Step completed: upload (2.8s)', stepId: '1', stepName: 'upload' },

  { id: '6', timestamp: '2023-01-01T00:00:05.678Z', level: 'INFO' as const, message: 'Starting step: validate', stepId: '2', stepName: 'validate' },
  { id: '7', timestamp: '2023-01-01T00:00:06.901Z', level: 'INFO' as const, message: 'Validating document schema', stepId: '2', stepName: 'validate' },
  { id: '8', timestamp: '2023-01-01T00:00:07.234Z', level: 'WARN' as const, message: 'Document missing optional field: author', stepId: '2', stepName: 'validate' },
  { id: '9', timestamp: '2023-01-01T00:00:08.567Z', level: 'SUCCESS' as const, message: 'Step completed: validate (2.8s)', stepId: '2', stepName: 'validate' },

  { id: '10', timestamp: '2023-01-01T00:00:09.890Z', level: 'INFO' as const, message: 'Starting step: extract', stepId: '3', stepName: 'extract' },
  { id: '11', timestamp: '2023-01-01T00:00:11.123Z', level: 'INFO' as const, message: 'Extracting text from PDF (45 pages)', stepId: '3', stepName: 'extract' },
  { id: '12', timestamp: '2023-01-01T00:00:13.456Z', level: 'SUCCESS' as const, message: 'Step completed: extract (3.8s)', stepId: '3', stepName: 'extract' },

  { id: '13', timestamp: '2023-01-01T00:00:14.789Z', level: 'INFO' as const, message: 'Starting parallel processing: parsing' },
  { id: '14', timestamp: '2023-01-01T00:00:15.012Z', level: 'INFO' as const, message: 'Starting step: parse-tables', stepId: '4', stepName: 'parse-tables' },
  { id: '15', timestamp: '2023-01-01T00:00:15.012Z', level: 'INFO' as const, message: 'Starting step: parse-text', stepId: '5', stepName: 'parse-text' },
  { id: '16', timestamp: '2023-01-01T00:00:15.012Z', level: 'INFO' as const, message: 'Starting step: parse-images', stepId: '6', stepName: 'parse-images' },
  { id: '17', timestamp: '2023-01-01T00:00:16.345Z', level: 'INFO' as const, message: 'Found 12 tables in document', stepId: '4', stepName: 'parse-tables' },
  { id: '18', timestamp: '2023-01-01T00:00:17.678Z', level: 'INFO' as const, message: 'Extracted 45,000 words', stepId: '5', stepName: 'parse-text' },
  { id: '19', timestamp: '2023-01-01T00:00:18.901Z', level: 'INFO' as const, message: 'Processing 23 images', stepId: '6', stepName: 'parse-images' },
  { id: '20', timestamp: '2023-01-01T00:00:18.812Z', level: 'SUCCESS' as const, message: 'Step completed: parse-tables (3.8s)', stepId: '4', stepName: 'parse-tables' },
  { id: '21', timestamp: '2023-01-01T00:00:18.812Z', level: 'SUCCESS' as const, message: 'Step completed: parse-text (3.8s)', stepId: '5', stepName: 'parse-text' },
  { id: '22', timestamp: '2023-01-01T00:00:19.812Z', level: 'WARN' as const, message: 'Image img_042.jpg is corrupted, skipping', stepId: '6', stepName: 'parse-images' },
  { id: '23', timestamp: '2023-01-01T00:00:19.812Z', level: 'SUCCESS' as const, message: 'Step completed: parse-images (4.8s)', stepId: '6', stepName: 'parse-images' },

  { id: '24', timestamp: '2023-01-01T00:00:20.145Z', level: 'INFO' as const, message: 'Starting step: transform', stepId: '7', stepName: 'transform' },
  { id: '25', timestamp: '2023-01-01T00:00:21.478Z', level: 'INFO' as const, message: 'Transforming data to target schema', stepId: '7', stepName: 'transform' },
  { id: '26', timestamp: '2023-01-01T00:00:22.945Z', level: 'SUCCESS' as const, message: 'Step completed: transform (2.8s)', stepId: '7', stepName: 'transform' },

  { id: '27', timestamp: '2023-01-01T00:00:23.278Z', level: 'INFO' as const, message: 'Starting step: store-database', stepId: '8', stepName: 'store-database' },
  { id: '28', timestamp: '2023-01-01T00:00:24.611Z', level: 'INFO' as const, message: 'Connecting to db-prod-1.us-east-1.rds.amazonaws.com', stepId: '8', stepName: 'store-database' },
  { id: '29', timestamp: '2023-01-01T00:00:25.944Z', level: 'WARN' as const, message: 'Connection slow: 2000ms latency', stepId: '8', stepName: 'store-database' },
  { id: '30', timestamp: '2023-01-01T00:00:26.277Z', level: 'WARN' as const, message: 'Connection slow: 3000ms latency', stepId: '8', stepName: 'store-database' },
  { id: '31', timestamp: '2023-01-01T00:00:28.610Z', level: 'ERROR' as const, message: 'Connection timeout after 5000ms', stepId: '8', stepName: 'store-database' },
  { id: '32', timestamp: '2023-01-01T00:00:28.943Z', level: 'ERROR' as const, message: 'Step failed: store-database', stepId: '8', stepName: 'store-database' },
  { id: '33', timestamp: '2023-01-01T00:00:29.276Z', level: 'INFO' as const, message: 'Workflow execution stopped due to step failure' },
  { id: '34', timestamp: '2023-01-01T00:00:29.609Z', level: 'INFO' as const, message: 'Step notify will not execute (workflow failed)' },
];

export default function IndividualRunPage() {
  // In a real app, runId would come from params

  return (
    // <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-background">
      <PageMain>
        <PageGrid>
          <SingleRunHeader
            runId="123"
            workflowName="document-processing-pipeline"
            status="COMPLETED"
            triggeredAt="2023-01-01T00:00:00Z"
            startedAt="2023-01-01T00:00:00Z"
            finishedAt="2023-01-01T00:00:00Z"
            duration={25000}
            totalSteps={9}
            completedSteps={7}
            onCopyConfig={() => console.log('Copy Config')}
            onViewWorkflow={() => console.log('View Workflow')}
            onReplay={() => console.log('Replay Workflow')}
            onCancel={() => console.log('Cancel Workflow')}
          />

          <SingleRunStepSection
            steps={mockSteps}
            onRetry={(stepId) => console.log('Retry', stepId)}
            onViewLogs={(stepId) => console.log('View logs', stepId)}
            onViewDAG={() => console.log('View DAG')}
            onViewWaterfall={() => console.log('View Waterfall')}
            onDownloadLogs={() => console.log('Download logs')}
          />

          <SingleRunActivityLog
            events={mockActivityLogs}
            autoScroll={true}
            maxHeight="32rem"
          />

        </PageGrid>
      </PageMain>
    // </div>
  );
}
