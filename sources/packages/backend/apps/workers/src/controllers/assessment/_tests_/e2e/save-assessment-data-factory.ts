import {
  ICustomHeaders,
  IOutputVariables,
  ZeebeJob,
} from "@camunda8/sdk/dist/zeebe/types";
import { createFakeWorkerJob } from "../../../../../test/utils/worker-job-mock";
import { SaveAssessmentDataJobInDTO } from "../../assessment.dto";

/**
 * Creates a fake save assessment data payload.
 * @param assessmentId assessment id.
 * @param assessmentData assessment data.
 * @returns fake save assessment data payload.
 */
export function createFakeSaveAssessmentDataPayload(
  assessmentId: number,
  assessmentData: unknown,
): Readonly<
  ZeebeJob<SaveAssessmentDataJobInDTO, ICustomHeaders, IOutputVariables>
> {
  return createFakeWorkerJob<
    SaveAssessmentDataJobInDTO,
    ICustomHeaders,
    IOutputVariables
  >({
    variables: { assessmentId, assessmentData },
  });
}
