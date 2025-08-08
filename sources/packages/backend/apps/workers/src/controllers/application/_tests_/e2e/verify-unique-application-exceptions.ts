import { ICustomHeaders, ZeebeJob } from "@camunda8/sdk/dist/zeebe/types";
import { createFakeWorkerJob } from "../../../../../test/utils/worker-job-mock";
import {
  ApplicationUniqueExceptionsJobInDTO,
  ApplicationUniqueExceptionsJobOutDTO,
} from "../../application.dto";

/**
 * Crates a fake verify unique application exceptions payload.
 * @param applicationId application id.
 * @returns fake verify unique application exceptions payload.
 */
export function createFakeVerifyUniqueApplicationExceptionsPayload(
  applicationId: number,
): Readonly<
  ZeebeJob<
    ApplicationUniqueExceptionsJobInDTO,
    ICustomHeaders,
    ApplicationUniqueExceptionsJobOutDTO
  >
> {
  const variables = {
    applicationId,
  };
  return createFakeWorkerJob<
    ApplicationUniqueExceptionsJobInDTO,
    ICustomHeaders,
    ApplicationUniqueExceptionsJobOutDTO
  >({
    variables,
  });
}
