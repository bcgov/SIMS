import { createFakeWorkerJob } from "../../../../../test/utils/worker-job-mock";
import { IOutputVariables, ZeebeJob } from "zeebe-node";
import { SupportingUserType } from "@sims/sims-db";
import {
  CreateSupportingUsersJobInDTO,
  CreateSupportingUsersJobOutDTO,
} from "../../supporting-user.dto";

/**
 * Creates a fake create supporting users payload.
 * @param applicationId application id.
 * @param supportingUsersTypes supporting user types to be created.
 * @returns fake create supporting users payload.
 */
export function createFakeCreateSupportingUsersPayload(
  applicationId: number,
  supportingUsersTypes: SupportingUserType[],
): Readonly<
  ZeebeJob<
    CreateSupportingUsersJobInDTO,
    IOutputVariables,
    CreateSupportingUsersJobOutDTO
  >
> {
  const variables = {
    applicationId,
    supportingUsersTypes,
  };
  return createFakeWorkerJob<
    CreateSupportingUsersJobInDTO,
    IOutputVariables,
    CreateSupportingUsersJobOutDTO
  >({
    variables,
  });
}
