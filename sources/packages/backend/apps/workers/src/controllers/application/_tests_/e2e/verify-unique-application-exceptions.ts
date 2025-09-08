import { ICustomHeaders, ZeebeJob } from "@camunda8/sdk/dist/zeebe/types";
import { createFakeWorkerJob } from "../../../../../test/utils/worker-job-mock";
import {
  ApplicationUniqueExceptionsJobInDTO,
  ApplicationUniqueExceptionsJobOutDTO,
} from "../../application.dto";
import { StudentFile } from "@sims/sims-db";

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

/**
 * Crated the expected exception data file for the application exception request.
 * @param studentFile student file associated with the exception request.
 * @returns exception data file object.
 */
export function createExceptionDataFile(studentFile: StudentFile): {
  url: string;
  name: string;
  originalName: string;
} {
  return {
    url: `fake-files/${studentFile.uniqueFileName}`,
    name: studentFile.uniqueFileName,
    originalName: studentFile.fileName,
  };
}
