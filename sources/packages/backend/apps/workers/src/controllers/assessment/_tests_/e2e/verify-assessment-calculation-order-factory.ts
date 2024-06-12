import { ICustomHeaders, ZeebeJob } from "@camunda8/sdk/dist/zeebe/types";
import { createFakeWorkerJob } from "../../../../../test/utils/worker-job-mock";
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
