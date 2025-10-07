import {
  ApplicationException,
  ApplicationExceptionRequest,
  ApplicationExceptionRequestStatus,
  User,
} from "@sims/sims-db";
import { faker } from "@faker-js/faker";
import { createFakeApplicationException } from "./application-exception";

/**
 * Create a fake application exception request.
 * @param relations dependencies:
 *  - `applicationException`: application exception requested.
 *  - `creator`: student user that created the request.
 * @param options additional options:
 *  - `initialData`: initial data to set on the application exception request.
 * @returns a fake application exception request.
 */
export function createFakeApplicationExceptionRequest(
  relations?: {
    applicationException?: ApplicationException;
    creator?: User;
  },
  options?: {
    initialData?: Partial<ApplicationExceptionRequest>;
  },
): ApplicationExceptionRequest {
  const applicationExceptionRequest = new ApplicationExceptionRequest();
  if (relations?.applicationException) {
    applicationExceptionRequest.applicationException =
      relations?.applicationException;
  } else {
    applicationExceptionRequest.applicationException =
      createFakeApplicationException({
        creator: relations?.creator,
      });
  }
  applicationExceptionRequest.exceptionName =
    options?.initialData?.exceptionName ?? faker.person.firstName();
  applicationExceptionRequest.exceptionDescription =
    options?.initialData?.exceptionDescription ??
    "Fake application exception description";
  applicationExceptionRequest.creator = relations?.creator;
  applicationExceptionRequest.exceptionHash =
    options?.initialData?.exceptionHash;
  applicationExceptionRequest.exceptionRequestStatus =
    options?.initialData?.exceptionRequestStatus ??
    ApplicationExceptionRequestStatus.Pending;
  return applicationExceptionRequest;
}
