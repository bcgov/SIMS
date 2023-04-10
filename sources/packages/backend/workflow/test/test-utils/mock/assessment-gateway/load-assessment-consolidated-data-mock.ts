import { WorkflowServiceTasks, WorkflowSubprocesses } from "../..";
import { WorkerMockedData } from "..";
import { AssessmentConsolidatedData } from "../../../models";

/**
 * Creates the mock for the 'Load assessment data task' completed.
 * @param options.
 * - `assessmentConsolidatedData` assessment consolidated data.
 * - `subprocess` related subprocess to mock the data.
 * @returns mock for the 'Load assessment data task' completed.
 */
export function createLoadAssessmentDataTaskMock(options: {
  assessmentConsolidatedData: AssessmentConsolidatedData;
  subprocess?:
    | WorkflowSubprocesses.LoadConsolidatedDataSubmitOrReassessment
    | WorkflowSubprocesses.LoadConsolidatedDataPreAssessment;
}): WorkerMockedData {
  const subprocesses = options.subprocess ? [options.subprocess] : null;
  return {
    serviceTaskId: WorkflowServiceTasks.LoadAssessmentConsolidatedData,
    options: {
      jobCompleteMock: options.assessmentConsolidatedData,
      subprocesses,
    },
  };
}
