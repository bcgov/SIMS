import { createFakeWorkerJob } from "../../../../../test/utils/worker-job-mock";
import { SupportingUserType } from "@sims/sims-db";
import {
  CreateIdentifiableSupportingUsersJobInDTO,
  CreateIdentifiableSupportingUsersJobOutDTO,
} from "../../supporting-user.dto";
import { ICustomHeaders, ZeebeJob } from "@camunda8/sdk/dist/zeebe/types";
import { APPLICATION_ID } from "@sims/services/workflow/variables/assessment-gateway";
import {
  SUPPORTING_USER_TYPE,
  FULL_NAME_PROPERTY_FILTER,
  IS_ABLE_TO_REPORT,
} from "@sims/services/workflow/variables/supporting-user-information-request";

/**
 * Creates a fake identifiable supporting users creation payload.
 * @param options input variables for creating identifiable supporting user.
 * - `applicationId`: ID of the application to which the supporting user belongs.
 * - `supportingUserType`: type of the supporting user (Parent or Partner).
 * - `parent`: indicates if the creation is for the first or second parent (1 for first parent, 2 for second parent).
 * - `isAbleToReport`: indicates if the supporting user is able to report their data to the Ministry.
 * @returns fake identifiable supporting users creation payload.
 */
export function createFakeCreateIdentifiableSupportingUsersPayload(options: {
  applicationId: number;
  supportingUserType: SupportingUserType;
  parent: 1 | 2;
  isAbleToReport: boolean;
}): Readonly<
  ZeebeJob<
    CreateIdentifiableSupportingUsersJobInDTO,
    ICustomHeaders,
    CreateIdentifiableSupportingUsersJobOutDTO
  >
> {
  return createFakeWorkerJob<
    CreateIdentifiableSupportingUsersJobInDTO,
    ICustomHeaders,
    CreateIdentifiableSupportingUsersJobOutDTO
  >({
    variables: {
      [APPLICATION_ID]: options.applicationId,
      [SUPPORTING_USER_TYPE]: options.supportingUserType,
      [FULL_NAME_PROPERTY_FILTER]: `$.parents[${
        options.parent - 1
      }].parentFullName`,
      [IS_ABLE_TO_REPORT]: options.isAbleToReport,
    },
  });
}
