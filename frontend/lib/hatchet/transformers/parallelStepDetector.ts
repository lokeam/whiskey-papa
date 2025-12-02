/**
 * Detects which workflow steps run in parallel by analyzing a given DAG structure.
 *
 * Logic:
 * 1. Build a "child -> parents" map (reverse of Hatchet's "parent -> children")
 * 2. Group steps that share the same set of parents
 * 3. Mark groups with 2+ steps as parallel
 *
 * @param shape - The workflow shape array from Hatchet
 * @returns Map of stepId to parallel info (only includes parallel steps)
 */

interface HatchetShapeItem {
  stepId: string;
  taskName: string;
  taskExternalId: string;
  childrenStepIds: string[];
}

interface ParallelStepInfo {
  isParallel: boolean;
  groupName: string;
}

export function detectParallelGroups(
  workflowShapeArr: HatchetShapeItem[]
): Map<string, ParallelStepInfo> {
  const workflowStepPreReqMap: Record<string, string[]> = {};

  // Build lookup table of steps associated with those needed to run before them
  for (let i = 0; i < workflowShapeArr.length; i++) {
    const currentStep = workflowShapeArr[i];

    // For each step that runs AFTER this one
    for (let j = 0; j < currentStep.childrenStepIds.length; j++) {
      const currStepPreReq = currentStep.childrenStepIds[j];

      // If we haven't seen this step before, create an empty array
      // since we need to list all the things need to be done before continuing
      if (!workflowStepPreReqMap[currStepPreReq]) {
        workflowStepPreReqMap[currStepPreReq] = [];
      }

      // Add currentStep as a prereq for next step.
      workflowStepPreReqMap[currStepPreReq].push(currentStep.stepId)
    }
  }

  // Group steps by the prereqs needed to run them
  const workflowPreReqToStepMap: Record<string, string[]> = {};

  // Mark groups w/ 2+ steps as parallel
  for (const step of workflowShapeArr) {
    const preRequisiteStep = workflowStepPreReqMap[step.stepId];

    if (preRequisiteStep && preRequisiteStep.length > 0) {
      // Create a unique lookup key
      const preReqKey = preRequisiteStep.sort().join(',');

      if (!workflowPreReqToStepMap[preReqKey]) {
        workflowPreReqToStepMap[preReqKey] = [];
      }

      workflowPreReqToStepMap[preReqKey].push(step.stepId);
    }
  }

  const workflowStepParallelGroupMap = new Map<string, ParallelStepInfo>();

  Object.entries(workflowPreReqToStepMap).forEach(([preReqKey, stepIdsArr]) => {
    // If multiple steps share the same prereq, they run in parallel
    if (stepIdsArr.length > 1) {
      const groupName = `parallel-${preReqKey.substring(0, 8)}`;

      for (const stepId of stepIdsArr) {
        workflowStepParallelGroupMap.set(stepId, {
          isParallel: true,
          groupName: groupName
        });
      }
    }
  })

  return workflowStepParallelGroupMap;
}