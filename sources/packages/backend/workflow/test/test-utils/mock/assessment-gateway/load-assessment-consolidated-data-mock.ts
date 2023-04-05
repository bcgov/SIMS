import { WorkflowServiceTasks } from "../..";
import { createMockedWorkerResult } from "..";
import { AssessmentConsolidatedData } from "../../../models";

/**
 * Creates the mock for the 'Load consolidated data' completed subprocess.
 * @param assessmentConsolidatedData assessment consolidated data.
 * @returns mock for the 'Load consolidated data' completed subprocess.
 */
export function createLoadAssessmentConsolidatedDataMock(options: {
  assessmentConsolidatedData: AssessmentConsolidatedData;
}): Record<string, unknown> {
  return createMockedWorkerResult(
    WorkflowServiceTasks.LoadAssessmentConsolidatedData,
    {
      jobCompleteMock: options.assessmentConsolidatedData,
    },
  );
}
