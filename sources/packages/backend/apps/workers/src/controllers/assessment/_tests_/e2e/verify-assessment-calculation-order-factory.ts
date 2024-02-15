import { createFakeWorkerJob } from "../../../../../test/utils/worker-job-mock";
import { ICustomHeaders, ZeebeJob } from "zeebe-node";
import {
  AssessmentDataJobInDTO,
  VerifyAssessmentCalculationOrderJobOutDTO,
} from "../../assessment.dto";

/**
 * Creates a fake verify assessment calculation order payload.
 * @param assessmentId assessment id.
 * @returns fake verify assessment calculation order payload.
 */
export function createFakeVerifyAssessmentCalculationOrderPayload(
  assessmentId: number,
): Readonly<
  ZeebeJob<
    AssessmentDataJobInDTO,
    ICustomHeaders,
    VerifyAssessmentCalculationOrderJobOutDTO
  >
> {
  return createFakeWorkerJob<
    AssessmentDataJobInDTO,
    ICustomHeaders,
    VerifyAssessmentCalculationOrderJobOutDTO
  >({
    variables: { assessmentId },
  });
}
