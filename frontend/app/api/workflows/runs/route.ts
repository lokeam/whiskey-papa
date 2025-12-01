import { NextRequest, NextResponse } from 'next/server';
import { getHatchetClient } from '@/lib/hatchet/client';


/**
 * List all workflow runs
 * GET /api/workflows/runs
 *
 * Returns a list of all workflow runs from Hatchet
 */


export async function GET(request: NextRequest) {
  try {
    // Get Hatchet client

    // Query Hatchet client for workflow list of runs, make HTTP req to Hatchet's rest api
    const hatchetClient = getHatchetClient();
    const response = await hatchetClient.admin.runs.list();

    console.log(hatchetClient.metrics.getWorkflowMetrics)

    return NextResponse.json({
      success: true,
      runs: response.rows || [],
      total: response.rows?.length || 0
    })

  } catch (error) {
    console.error('❌ Error listing runs:', error);

    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}