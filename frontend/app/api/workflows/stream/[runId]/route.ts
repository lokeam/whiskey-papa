import { NextRequest } from 'next/server';
import { getHatchetClient } from '@/lib/hatchet/client';

// Type for Hatchet workflow run response
interface HatchetWorkflowRunResponse {
  run: {
    displayName: string;
    status: string;
    startedAt: string;
    finishedAt?: string;
    duration?: number;
    metadata: {
      id: string;
      createdAt: string;
      updatedAt: string;
    };
  };
  tasks: unknown[];
}

/**
 * Stream workflow run events via Server-Sent Events (SSE)
 * GET /api/workflows/stream/[runId]
 *
 * This endpoint:
 * 1. Accepts a workflow run ID from the URL
 * 2. Connects to Hatchet's event stream for that run
 * 3. Streams events to the browser in SSE format
 *
 * The browser uses EventSource API to consume this stream.
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  // Validate the runId
  const { runId } = await params;
  if (!runId || typeof runId !== 'string') {
    return new Response(
      JSON.stringify({ success: false, message: 'Invalid run ID' }),
      { status: 400 }
    );
  }

  console.log(`📡 Kicking off SSE stream for run: ${runId}`);

  // Get singleton Hatchet client
  let hatchet;
  try {
    hatchet = getHatchetClient();
  } catch(error) {
    console.error(`❌ Failed to get Hatchet client:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to intialize Hatchet client'
      }),
      { status: 500 }
    );
  }

  // Create streaming response
  const stream = new ReadableStream({
    async start(controller) {
      console.log(`✅ Starting polling for run: ${runId}`);

      let lastStatus = '';
      let isComplete = false;

      // Poll function - checks Hatchet for updates
      const poll = async () => {
        if (isComplete) return;

        try {
          // Get workflow run from Hatchet REST API
          const response = await hatchet.admin.runs.get(runId);

          // Response structure: { run: {...}, tasks: [...] }
          const typedResponse = response as unknown as HatchetWorkflowRunResponse;

          if (!typedResponse.run) {
            console.error('No run in response:', Object.keys(response));
            throw new Error('Workflow run not found in response');
          }

          const run = typedResponse.run;

          // Only send update if status changed
          if (run.status !== lastStatus) {
            lastStatus = run.status;

            console.log(`📨 Status update: ${run.status}`);

            // Create event payload
            const event = {
              type: 'STATUS_UPDATE',
              payload: {
                runId: run.metadata?.id || runId,
                status: run.status,
                workflowName: run.displayName || 'Unknown',
                startedAt: run.startedAt,
                finishedAt: run.finishedAt,
                duration: run.duration,
              }
            };

            // Format as SSE and send to browser
            const sseMessage = `data: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(new TextEncoder().encode(sseMessage));
          }

          // Check if workflow is done
          if (run.status === 'SUCCEEDED' || run.status === 'FAILED' || run.status === 'CANCELLED') {
            console.log(`✅ Workflow ${run.status}, closing stream`);
            isComplete = true;
            controller.close();
          }
        } catch (error) {
          console.error(`❌ Error polling run:`, error);

          // Send error to client
          const errorMsg = `data: ${JSON.stringify({
            type: 'ERROR',
            message: error instanceof Error ? error.message : 'Polling error'
          })}\n\n`;
          controller.enqueue(new TextEncoder().encode(errorMsg));

          isComplete = true;
          controller.close();
        }
      };

      // Poll immediately, then every 1 second
      await poll();

      const interval = setInterval(async () => {
        if (isComplete) {
          clearInterval(interval);
          return;
        }
        await poll();
      }, 1000);
    },

    // Client disconnected
    cancel() {
      console.log(`🔌 Client disconnected from stream: ${runId}`);
    }
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

