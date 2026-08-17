import { ICustomHeaders, ZeebeJob } from "@camunda8/sdk/dist/zeebe/types";
import { createFakeWorkerJob } from "../../../../../test/utils/worker-job-mock";
import {
  CreateIncomeRequestJobInDTO,
  CreateIncomeRequestJobOutDTO,
} from "../../cra-integration.dto";
import { APPLICATION_ID } from "@sims/services/workflow/variables/assessment-gateway";
import {
  TAX_YEAR,
  REPORTED_INCOME,
  SUPPORTING_USER_ID,
} from "@sims/services/workflow/variables/cra-integration-income-verification";

/**
 * Creates a fake income request data payload.
 * @param applicationId application ID.
 * @param options factory options.
 * - `supportingUserId` supporting user ID for non-student income requests.
 * @returns fake load fake income request data payload.
 */
export function createFakeCreateIncomeRequestDataPayload(
  applicationId: number,
  options?: {
    supportingUserId?: number;
  },
): Readonly<
  ZeebeJob<
    CreateIncomeRequestJobInDTO,
    ICustomHeaders,
    CreateIncomeRequestJobOutDTO
  >
> {
  return createFakeWorkerJob<
    CreateIncomeRequestJobInDTO,
    ICustomHeaders,
    CreateIncomeRequestJobOutDTO
  >({
    variables: {
      [APPLICATION_ID]: applicationId,
      [TAX_YEAR]: 2022,
      [REPORTED_INCOME]: 1000,
      [SUPPORTING_USER_ID]: options?.supportingUserId,
    },
  });
}
