import {
  ApplicationException,
  ApplicationExceptionStatus,
  NoteType,
  User,
} from "@sims/sims-db";
import { createFakeNote } from "./note";

export function createFakeApplicationException(
  applicationExceptionStatus: ApplicationExceptionStatus,
  relations: {
    creator: User;
    assessedBy: User;
  },
): ApplicationException {
  const applicationException = new ApplicationException();
  applicationException.exceptionStatus = applicationExceptionStatus;
  applicationException.assessedDate = new Date();
  applicationException.assessedBy = relations.assessedBy;
  applicationException.creator = relations.creator;
  const applicationExceptionNote = createFakeNote(NoteType.Application, {
    creator: relations.creator,
  });
  applicationException.exceptionNote = applicationExceptionNote;
  return applicationException;
}
