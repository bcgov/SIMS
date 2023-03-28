import {
  ApplicationException,
  ApplicationExceptionStatus,
  NoteType,
  User,
} from "@sims/sims-db";
import { createFakeNote } from "./note";

/**
 * Creates a fake application exception with the passed status.
 * @param relations dependencies:
 * - `applicationExceptionStatus` application exception status.
 * - `creator` student user that created the application,
 * - `assessedBy` ministry user that approved or denied the application exception.
 * @returns a fake application exception.
 */
export function createFakeApplicationException(relations?: {
  creator?: User;
  assessedBy?: User;
}): ApplicationException {
  const applicationException = new ApplicationException();
  applicationException.exceptionStatus = ApplicationExceptionStatus.Pending;
  applicationException.assessedDate = new Date();
  applicationException.assessedBy = relations?.assessedBy;
  applicationException.creator = relations?.creator;
  const applicationExceptionNote = createFakeNote(NoteType.Application, {
    creator: relations?.creator,
  });
  applicationException.exceptionNote = applicationExceptionNote;
  return applicationException;
}
