import { ZeebeJob } from "@camunda8/sdk/dist/zeebe/types";
import { createFakeWorkerJob } from "../../../../../test/utils/worker-job-mock";
import {
  ProgramInfoRequestJobHeaderDTO,
  ProgramInfoRequestJobInDTO,
  ProgramInfoRequestJobOutDTO,
} from "../../program-info-request.dto";
import { ProgramInfoStatus } from "@sims/sims-db";

/**
 * Creates a fake payload to update application pir status.
 * @param applicationId application id.
 * @param studentDataSelectedProgram pir education program id.
 * @param programInfoStatus pir status.
 * @returns fake payload to update application status.
 */
export function createFakeUpdatePIRStatusPayload(
  applicationId: number,
  studentDataSelectedProgram: number,
  programInfoStatus: ProgramInfoStatus,
): Readonly<
  ZeebeJob<
    ProgramInfoRequestJobInDTO,
    ProgramInfoRequestJobHeaderDTO,
    ProgramInfoRequestJobOutDTO
  >
> {
  const variables = {
    applicationId,
    studentDataSelectedProgram,
  };
  return createFakeWorkerJob<
    ProgramInfoRequestJobInDTO,
    ProgramInfoRequestJobHeaderDTO,
    ProgramInfoRequestJobOutDTO
  >({
    variables,
    customHeaders: { programInfoStatus },
  });
}
