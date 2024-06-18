import { ICustomHeaders, ZeebeJob } from "@camunda8/sdk/dist/zeebe/types";
import { createFakeWorkerJob } from "../../../../../test/utils/worker-job-mock";
import {
  ApplicationExceptionsJobInDTO,
  ApplicationExceptionsJobOutDTO,
} from "../../application.dto";

/**
 * Crates a fake verify application exceptions payload.
 * @param applicationId application id.
 * @returns fake verify application exceptions payload.
 */
export function createFakeVerifyApplicationExceptionsPayload(
  applicationId: number,
): Readonly<
  ZeebeJob<
    ApplicationExceptionsJobInDTO,
    ICustomHeaders,
    ApplicationExceptionsJobOutDTO
  >
> {
  const variables = {
    applicationId,
  };
  return createFakeWorkerJob<
    ApplicationExceptionsJobInDTO,
    ICustomHeaders,
    ApplicationExceptionsJobOutDTO
  >({
    variables,
  });
}
