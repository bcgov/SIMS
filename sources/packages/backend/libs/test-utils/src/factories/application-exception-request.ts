import {
  ApplicationException,
  ApplicationExceptionRequest,
  User,
} from "@sims/sims-db";
import * as faker from "faker";

export function createFakeApplicationExceptionRequest(
  applicationException: ApplicationException,
  relations: {
    creator: User;
  },
): ApplicationExceptionRequest {
  const applicationExceptionRequest = new ApplicationExceptionRequest();
  applicationExceptionRequest.applicationException = applicationException;
  applicationExceptionRequest.exceptionName = faker.name.firstName();
  applicationExceptionRequest.creator = relations.creator;
  return applicationExceptionRequest;
}
