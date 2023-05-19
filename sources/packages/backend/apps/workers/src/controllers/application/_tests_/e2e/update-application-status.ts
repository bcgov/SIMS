import { createFakeWorkerJob } from "../../../../../test/utils/worker-job-mock";
import { IOutputVariables, ZeebeJob } from "zeebe-node";
import { ApplicationStatus } from "@sims/sims-db";
import {
  ApplicationUpdateStatusJobHeaderDTO,
  ApplicationUpdateStatusJobInDTO,
} from "../../application.dto";

/**
 * Creates a fake update application status payload.
 * @param applicationId application id.
 * @param fromStatus from status.
 * @param toStatus to status.
 * @returns fake update application status payload.
 */
export function createFakeUpdateApplicationStatusPayload(
  applicationId: number,
  fromStatus: ApplicationStatus,
  toStatus: ApplicationStatus,
): Readonly<
  ZeebeJob<
    ApplicationUpdateStatusJobInDTO,
    ApplicationUpdateStatusJobHeaderDTO,
    IOutputVariables
  >
> {
  return createFakeWorkerJob<
    ApplicationUpdateStatusJobInDTO,
    ApplicationUpdateStatusJobHeaderDTO,
    IOutputVariables
  >({
    variables: { applicationId },
    customHeaders: { fromStatus, toStatus },
  });
}
