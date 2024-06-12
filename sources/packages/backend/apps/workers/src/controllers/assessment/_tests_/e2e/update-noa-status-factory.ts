import { IOutputVariables, ZeebeJob } from "@camunda8/sdk/dist/zeebe/types";
import { createFakeWorkerJob } from "../../../../../test/utils/worker-job-mock";
import {
  UpdateNOAStatusHeaderDTO,
  UpdateNOAStatusJobInDTO,
} from "../../assessment.dto";
import { AssessmentStatus } from "@sims/sims-db";

/**
 * Creates a fake update NOA status payload.
 * @param assessmentId assessment id.
 * @returns fake update NOA status payload.
 */
export function createFakeUpdateNOAStatusPayload(
  assessmentId: number,
): Readonly<
  ZeebeJob<UpdateNOAStatusJobInDTO, UpdateNOAStatusHeaderDTO, IOutputVariables>
> {
  return createFakeWorkerJob<
    UpdateNOAStatusJobInDTO,
    UpdateNOAStatusHeaderDTO,
    IOutputVariables
  >({
    variables: { assessmentId },
    customHeaders: { status: AssessmentStatus.completed },
  });
}
