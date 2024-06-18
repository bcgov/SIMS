import { createFakeWorkerJob } from "../../../../../test/utils/worker-job-mock";
import { SupportingUserType } from "@sims/sims-db";
import {
  CreateSupportingUsersJobInDTO,
  CreateSupportingUsersJobOutDTO,
} from "../../supporting-user.dto";
import { ICustomHeaders, ZeebeJob } from "@camunda8/sdk/dist/zeebe/types";

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
    ICustomHeaders,
    CreateSupportingUsersJobOutDTO
  >
> {
  const variables = {
    applicationId,
    supportingUsersTypes,
  };
  return createFakeWorkerJob<
    CreateSupportingUsersJobInDTO,
    ICustomHeaders,
    CreateSupportingUsersJobOutDTO
  >({
    variables,
  });
}
