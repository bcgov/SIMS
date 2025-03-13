import { createFakeWorkerJob } from "../../../../../test/utils/worker-job-mock";
import {
  ApplicationChangeRequestApprovalJobInDTO,
  ApplicationChangeRequestApprovalJobOutDTO,
} from "../../application.dto";
import { ICustomHeaders, ZeebeJob } from "@camunda8/sdk/dist/zeebe/types";

/**
 * Creates a fake application change request approval payload.
 * @param applicationId application ID.
 * @returns fake application change request approval payload.
 */
export function createFakeApplicationChangeRequestApprovalPayload(
  applicationId: number,
): Readonly<
  ZeebeJob<
    ApplicationChangeRequestApprovalJobInDTO,
    ICustomHeaders,
    ApplicationChangeRequestApprovalJobOutDTO
  >
> {
  return createFakeWorkerJob<
    ApplicationChangeRequestApprovalJobInDTO,
    ICustomHeaders,
    ApplicationChangeRequestApprovalJobOutDTO
  >({
    variables: { applicationId },
  });
}
