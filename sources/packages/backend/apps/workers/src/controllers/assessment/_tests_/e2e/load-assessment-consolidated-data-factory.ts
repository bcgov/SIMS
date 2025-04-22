import {
  ICustomHeaders,
  IOutputVariables,
  ZeebeJob,
} from "@camunda8/sdk/dist/zeebe/types";
import { createFakeWorkerJob } from "../../../../../test/utils/worker-job-mock";
import { AssessmentDataJobInDTO } from "../../assessment.dto";

/**
 * Creates a fake load assessment consolidated data payload.
 * @param assessmentId assessment id.
 * @param customHeaders custom headers.
 * @returns fake load assessment consolidated data payload.
 */
export function createFakeLoadAssessmentConsolidatedDataPayload(
  assessmentId: number,
  customHeaders: ICustomHeaders,
): Readonly<
  ZeebeJob<AssessmentDataJobInDTO, ICustomHeaders, IOutputVariables>
> {
  return createFakeWorkerJob<
    AssessmentDataJobInDTO,
    ICustomHeaders,
    IOutputVariables
  >({
    variables: { assessmentId },
    customHeaders,
  });
}
