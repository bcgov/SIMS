import {
  ApplicationException,
  ApplicationExceptionRequest,
  User,
} from "@sims/sims-db";
import * as faker from "faker";
import { createFakeApplicationException } from "./application-exception";

/**
 * Create a fake application exception request.
 * @param relations dependencies:
 *  - `applicationException`: application exception requested.
 *  - `creator`: student user that created the request.
 * @returns a fake application exception request.
 */
export function createFakeApplicationExceptionRequest(relations?: {
  applicationException?: ApplicationException;
  creator?: User;
}): ApplicationExceptionRequest {
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

  applicationExceptionRequest.exceptionName = faker.name.firstName();
  applicationExceptionRequest.exceptionDescription =
    "Fake application exception description";
  applicationExceptionRequest.creator = relations?.creator;
  return applicationExceptionRequest;
}
