import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection } from "typeorm";
import {
  Application,
  ApplicationException,
  ApplicationExceptionRequest,
  ApplicationExceptionStatus,
  Note,
  NoteType,
  Student,
  User,
} from "../../database/entities";
import { CustomNamedError } from "src/utilities";
import {
  STUDENT_APPLICATION_EXCEPTION_INVALID_STATE,
  STUDENT_APPLICATION_EXCEPTION_NOT_FOUND,
} from "../../constants";

/**
 * Manages student applications exceptions detected upon application submission.
 */
@Injectable()
export class ApplicationExceptionService extends RecordDataModelService<ApplicationException> {
  constructor(private readonly connection: Connection) {
    super(connection.getRepository(ApplicationException));
  }

  /**
   * Creates the exceptions associated with the application.
   * @param applicationId application that contains the exceptions.
   * @param exceptionNames unique identifier names for the exceptions.
   * @param auditUserId user that should be considered the one that is
   * causing the changes.
   */
  async createException(
    applicationId: number,
    exceptionNames: string[],
    auditUserId: number,
  ): Promise<ApplicationException> {
    const creator = { id: auditUserId } as User;
    const newException = new ApplicationException();
    newException.application = { id: applicationId } as Application;
    newException.creator = creator;
    newException.exceptionStatus = ApplicationExceptionStatus.Pending;
    newException.exceptionRequests = exceptionNames.map(
      (exceptionName) =>
        ({ exceptionName, creator } as ApplicationExceptionRequest),
    );
    return this.repo.save(newException);
  }

  async getExceptionById(exceptionId: number): Promise<ApplicationException> {
    return this.repo
      .createQueryBuilder("exception")
      .select([
        "exception.id",
        "exception.exceptionStatus",
        "exceptionNote.description",
        "exceptionRequest.exceptionName",
      ])
      .innerJoin("exception.exceptionRequests", "exceptionRequest")
      .innerJoin("exception.exceptionNote", "exceptionNote")
      .where("exception.id = :exceptionId", { exceptionId })
      .getOne();
  }

  async approveException(
    exceptionId: number,
    exceptionStatus: ApplicationExceptionStatus,
    noteDescription: string,
    auditUserId: number,
  ): Promise<ApplicationException> {
    return this.connection.transaction(async (transactionalEntityManager) => {
      const applicationExceptionRepo =
        transactionalEntityManager.getRepository(ApplicationException);
      const exceptionToUpdate = await applicationExceptionRepo
        .createQueryBuilder("exception")
        .select([
          "exception.id",
          "exception.exceptionStatus",
          "application.id",
          "student.id",
        ])
        .innerJoin("exception.application", "application")
        .innerJoin("application.student", "student")
        .where("exception.id = :exceptionId", { exceptionId })
        .getOne();

      if (!exceptionToUpdate) {
        throw new CustomNamedError(
          "Student application exception not found.",
          STUDENT_APPLICATION_EXCEPTION_NOT_FOUND,
        );
      }

      if (
        exceptionToUpdate.exceptionStatus !== ApplicationExceptionStatus.Pending
      ) {
        throw new CustomNamedError(
          `Student application exception must be in ${ApplicationExceptionStatus.Pending} state to be assessed.`,
          STUDENT_APPLICATION_EXCEPTION_INVALID_STATE,
        );
      }

      const auditUser = { id: auditUserId } as User;
      // Create the note to be associated with the update.
      const newNote = new Note();
      newNote.description = noteDescription;
      newNote.noteType = NoteType.Application;
      newNote.creator = auditUser;
      const savedNote = await transactionalEntityManager
        .getRepository(Note)
        .save(newNote);
      // Associate the created note with the student.
      await transactionalEntityManager
        .getRepository(Student)
        .createQueryBuilder()
        .relation(Student, "notes")
        .of(exceptionToUpdate.application.student)
        .add(savedNote);
      // Update the application exception.
      exceptionToUpdate.exceptionStatus = exceptionStatus;
      exceptionToUpdate.exceptionNote = savedNote;
      exceptionToUpdate.assessedBy = auditUser;
      exceptionToUpdate.assessedDate = new Date();
      exceptionToUpdate.modifier = auditUser;
      return applicationExceptionRepo.save(exceptionToUpdate);
    });
  }
}
