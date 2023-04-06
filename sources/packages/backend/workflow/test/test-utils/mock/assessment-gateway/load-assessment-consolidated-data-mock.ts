import { WorkflowServiceTasks, WorkflowSubprocesses } from "../..";
import { WorkerMockedData } from "..";
import { AssessmentConsolidatedData } from "../../../models";

/**
 * Creates the mock for the 'Load assessment data task' completed.
 * @param assessmentConsolidatedData assessment consolidated data.
 * @returns mock for the 'Load assessment data task' completed.
 */
export function createLoadAssessmentDataTaskMock(options: {
  assessmentConsolidatedData: AssessmentConsolidatedData;
  subprocess:
    | WorkflowSubprocesses.LoadConsolidatedDataSubmitOrReassessment
    | WorkflowSubprocesses.LoadConsolidatedDataPreAssessment;
}): WorkerMockedData {
  return {
    serviceTaskId: WorkflowServiceTasks.LoadAssessmentConsolidatedData,
    options: {
      jobCompleteMock: options.assessmentConsolidatedData,
      subprocesses: [options.subprocess],
    },
  };
}
