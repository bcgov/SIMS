import { createFakeWorkerJob } from "../../../../../test/utils/worker-job-mock";
import { ZeebeJob } from "zeebe-node";
import {
  ProgramInfoRequestJobHeaderDTO,
  ProgramInfoRequestJobInDTO,
  ProgramInfoRequestJobOutDTO,
} from "../../program-info-request.dto";
import { ProgramInfoStatus } from "@sims/sims-db";

/**
 * Creates a fake payload to update application status.
 * @param applicationId application id.
 * @param studentDataSelectedProgram pir education program id.
 * @param programInfoStatus pir status.
 * @returns fake payload to update application status.
 */
export function createFakeUpdateApplicationStatusPayload(
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
