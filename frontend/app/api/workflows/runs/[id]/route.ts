import { NextRequest, NextResponse } from 'next/server';
import { getHatchetClient } from '@/lib/hatchet/client';
import { transformRawRunData } from '@/lib/hatchet/transformers/runTransformer';

/**
 * GET /api/workflows/runs/[id]
 *
 * Fetches a single workflow run with complete details:
 * - Run metadata (status, duration, timestamps)
 * - Step execution data (with parallel grouping)
 * - Activity event logs
 *
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {

  try {
    // Grab run ID from parms, quit early if absent
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: 'Run ID is required '},
        { status: 400 }
      );
    }


  // Fetch raw data from Hatchet
  const hatchetClient = getHatchetClient();
  const rawResponse = await hatchetClient.admin.runs.get(id);

  // DEBUG: Log raw response to see what Hatchet is returning
  console.log('=== RAW HATCHET RESPONSE ===');
  console.log('Run:', JSON.stringify(rawResponse.run, null, 2));
  console.log('Tasks count:', rawResponse.tasks?.length || 0);
  console.log('TaskEvents count:', rawResponse.taskEvents?.length || 0);
  console.log('Shape count:', rawResponse.shape?.length || 0);
  if (rawResponse.shape && rawResponse.shape.length > 0) {
    console.log('Shape array:', JSON.stringify(rawResponse.shape, null, 2));
  }
  if (rawResponse.tasks?.length > 0) {
    console.log('First task sample:', JSON.stringify(rawResponse.tasks[0], null, 2));
    console.log('Task timestamp fields:');
    console.log('  createdAt:', rawResponse.tasks[0].createdAt);
    console.log('  taskInsertedAt:', rawResponse.tasks[0].taskInsertedAt);
    console.log('  startedAt:', rawResponse.tasks[0].startedAt);
    console.log('  finishedAt:', rawResponse.tasks[0].finishedAt);
  }

  // Transform
  const transformedResponse = transformRawRunData(rawResponse);

  // DEBUG: Log transformed response
  console.log('=== TRANSFORMED RESPONSE ===');
  console.log('Status:', transformedResponse.status);
  console.log('Duration:', transformedResponse.duration);
  console.log('Total steps:', transformedResponse.totalSteps);
  console.log('Completed steps:', transformedResponse.completedSteps);
  console.log('Steps with isParallel=true:', transformedResponse.steps.filter(s => s.isParallel).length);
  const parallelSteps = transformedResponse.steps.filter(s => s.isParallel);
  if (parallelSteps.length > 0) {
    console.log('Parallel steps:', parallelSteps.map(s => ({ name: s.name, group: s.parentGroup })));
  }

  return NextResponse.json(transformedResponse);

  } catch(err) {
    console.error('Error fetching workflow run: ', err);

    return NextResponse.json(
      { error: 'Failed to fetch workflow run' },
      { status: 500 }
    );
  }
}
