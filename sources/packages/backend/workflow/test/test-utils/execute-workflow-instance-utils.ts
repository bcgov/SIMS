import { CreateProcessInstanceWithResultResponse } from "zeebe-node";
import { ZeebeMockedClient } from "./mock";
import {
  AssessmentConsolidatedData,
  CalculatedAssessmentModel,
} from "../models";
import { PROCESS_INSTANCE_CREATE_TIMEOUT } from "./constants/system-configurations-constants";

/**
 * Executes the fulltime-assessment-* or parttime-assessment-* BPMN workflow.
 * @param bpmnProcessId bpm process id to be invoked.
 * @param assessmentConsolidatedData assessment data.
 * @returns result of the workflow execution.
 */
async function executeAssessment(
  bpmnProcessId: string,
  assessmentConsolidatedData: AssessmentConsolidatedData,
): Promise<CreateProcessInstanceWithResultResponse<CalculatedAssessmentModel>> {
  return ZeebeMockedClient.getMockedZeebeInstance().createProcessInstanceWithResult<
    AssessmentConsolidatedData,
    CalculatedAssessmentModel
  >({
    bpmnProcessId: bpmnProcessId,
    variables: {
      ...assessmentConsolidatedData,
    },
    requestTimeout: PROCESS_INSTANCE_CREATE_TIMEOUT,
  });
}

/**
 * Executes the fulltime-assessment-* BPMN workflow.
 * @param programYear program year to be invoked.
 * @param assessmentConsolidatedData assessment data.
 * @returns result of the workflow execution.
 */
export async function executeFullTimeAssessmentForProgramYear(
  programYear: string,
  assessmentConsolidatedData: AssessmentConsolidatedData,
): Promise<CreateProcessInstanceWithResultResponse<CalculatedAssessmentModel>> {
  return executeAssessment(
    `fulltime-assessment-${programYear}`,
    assessmentConsolidatedData,
  );
}

/**
 * Executes the parttime-assessment-* BPMN workflow.
 * @param programYear program year to be invoked.
 * @param assessmentConsolidatedData assessment data.
 * @returns result of the workflow execution.
 */
export async function executePartTimeAssessmentForProgramYear(
  programYear: string,
  assessmentConsolidatedData: AssessmentConsolidatedData,
): Promise<CreateProcessInstanceWithResultResponse<CalculatedAssessmentModel>> {
  return executeAssessment(
    `parttime-assessment-${programYear}`,
    assessmentConsolidatedData,
  );
}

/**
 * Executes the parttime-configure-disbursement BPMN workflow.
 * @param assessmentConsolidatedData assessment data.
 * @returns result of the workflow execution.
 */
export async function executePartTimeConfigureDisbursement(
  assessmentConsolidatedData: AssessmentConsolidatedData,
): Promise<CreateProcessInstanceWithResultResponse<CalculatedAssessmentModel>> {
  return executeAssessment(
    `parttime-configure-disbursement`,
    assessmentConsolidatedData,
  );
}
