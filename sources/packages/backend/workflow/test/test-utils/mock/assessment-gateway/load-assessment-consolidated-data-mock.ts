import { WorkflowServiceTasks } from "../..";
import { WorkerMockedData } from "..";
import { AssessmentConsolidatedData } from "../../../models";

/**
 * Creates the mock for the 'Load consolidated data' completed subprocess.
 * @param assessmentConsolidatedData assessment consolidated data.
 * @returns mock for the 'Load consolidated data' completed subprocess.
 */
export function createLoadAssessmentConsolidatedDataMock(options: {
  assessmentConsolidatedData: AssessmentConsolidatedData;
}): WorkerMockedData {
  return {
    serviceTaskId: WorkflowServiceTasks.LoadAssessmentConsolidatedData,
    options: {
      jobCompleteMock: options.assessmentConsolidatedData,
    },
  };
}
