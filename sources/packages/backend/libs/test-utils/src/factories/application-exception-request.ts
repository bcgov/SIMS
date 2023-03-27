import {
  ApplicationException,
  ApplicationExceptionRequest,
  ApplicationExceptionStatus,
  User,
} from "@sims/sims-db";
import { createFakeApplicationException } from "./application-exception";

/**
 * Create a fake application exception request.
 * @param relations dependencies:
 *  - `applicationException`: application exception requested.
 *  - `creator`: student user that created the request.
 * @returns a fake application exception request.
 */
export function createFakeApplicationExceptionRequest(relations: {
  applicationException?: ApplicationException;
  creator: User;
}): ApplicationExceptionRequest {
  const applicationExceptionRequest = new ApplicationExceptionRequest();
  applicationExceptionRequest.applicationException =
    relations.applicationException ??
    createFakeApplicationException({
      applicationExceptionStatus: ApplicationExceptionStatus.Pending,
      creator: relations.creator,
    });
  applicationExceptionRequest.exceptionName = relations.creator.firstName;
  applicationExceptionRequest.creator = relations.creator;
  return applicationExceptionRequest;
}
