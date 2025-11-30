import { NextRequest, NextResponse } from 'next/server';
import { getHatchetClient } from '@/lib/hatchet/client';
import type { TriggerWorkflowRequest, TriggerWorkflowResponse } from '@/lib/hatchet/types';

/**
 * Workflow Trigger API Endpoint
 *
 * PURPOSE:
 * Triggers Hatchet workflows from the frontend and returns a workflow run ID
 * for tracking. This is the bridge between the UI and Hatchet's execution engine.
 *
 * ENDPOINT: POST /api/workflows/trigger
 *
 * REQUEST BODY:
 * {
 *   workflowName: string,  // e.g., "document:process", "dag:parallel"
 *   input: object          // Workflow-specific input data
 * }
 *
 * RESPONSE:
 * {
 *   success: boolean,
 *   workflowRunId: string, // Use this to track/stream the run
 *   message?: string
 * }
 *
 * NOTE:
 *  Use hatchet.admin.runWorkflow() instead of hatchet.events.push() because:
 *
 * - runWorkflow() returns a WorkflowRunRef with the run ID
 * - events.push() is fire-and-forget (no run ID returned)
 * - We need the run ID for real-time streaming and status tracking
 * */

export async function POST(request: NextRequest) {
  // STEP 1: Parse + validate body
  const requestBody: TriggerWorkflowRequest = await request.json().catch(() => null);
  if (!requestBody) {
    return NextResponse.json(
      { success: false, message: 'Invalid JSON - missing or malformed req body' },
      { status: 400 },
    );
  }

  // Validate the workflowName
  if (!requestBody.workflowName || typeof requestBody.workflowName !== 'string') {
    return NextResponse.json(
      { success: false, message: 'Invalid JSON - missing or malformed workflowName field' },
      { status: 400 },
    );
  }

  // Validate input
  if (!requestBody.input || typeof requestBody.input !== 'object') {
    return NextResponse.json(
      { success: false, message: 'Invalid JSON - missing or malformed input field' },
      { status: 400 },
    );
  }

  try {
    // STEP 2: Get singleton Hatchet client
    const hatchetClient = getHatchetClient();

    // STEP 3: Trigger workflow and get run reference
    console.log(`🚀 Triggering: ${requestBody.workflowName}`);
    const workflowRun = await hatchetClient.admin.runWorkflow(
      requestBody.workflowName,
      requestBody.input
    );

    // Extract the run ID
    const workflowRunId = await workflowRun.getWorkflowRunId();
    console.log(`✅ Triggered: ${workflowRunId}`);

    const response: TriggerWorkflowResponse = {
      success: true,
      workflowRunId,
      message: `Workflow "${requestBody.workflowName}" triggered successfully`
    };

    return NextResponse.json(response);

  } catch (error) {
      /**
     * ERROR TYPES:
     *
     * 1. Hatchet client initialization error (missing token)
     *    - Thrown by getHatchetClient()
     *    - 500 Internal Server Error (configuration issue)
     *
     * 2. Network error connecting to Hatchet
     *    - Network timeout, DNS failure, etc.
     *    - 503 Service Unavailable
     *
     * 3. Workflow doesn't exist
     *    - Hatchet returns error
     *    - 400 Bad Request (client error)
     *
     * 4. Invalid input data
     *    - Workflow rejects the input
     *    - 400 Bad Request
     *
     * For simplicity in this demo, we're returning 500 for all errors.
     * In prod, we'd inspect error.message to determine the appropriate status.
     */

    console.error('❌ Error triggering workflow:', error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
