import { CreateProcessInstanceWithResultResponse } from "zeebe-node";
import { ZeebeMockedClient } from "./mock";
import {
  AssessmentConsolidatedData,
  CalculatedAssessmentModel,
} from "../models";
import { PROCESS_INSTANCE_CREATE_TIMEOUT } from "./constants/system-configurations-constants";

/**
 * Executes the fulltime-assessment-* BPMN workflow.
 * @param programYear program year to be invoked.
 * @param assessmentConsolidatedData assessment data.
 * @returns result of the workflow execution.
 */
export async function executeFulltimeAssessmentForProgramYear(
  programYear: string,
  assessmentConsolidatedData: AssessmentConsolidatedData,
): Promise<CreateProcessInstanceWithResultResponse<CalculatedAssessmentModel>> {
  return ZeebeMockedClient.getMockedZeebeInstance().createProcessInstanceWithResult<
    AssessmentConsolidatedData,
    CalculatedAssessmentModel
  >({
    bpmnProcessId: `fulltime-assessment-${programYear}`,
    variables: {
      ...assessmentConsolidatedData,
    },
    requestTimeout: PROCESS_INSTANCE_CREATE_TIMEOUT,
  });
}
