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
import { CustomNamedError } from "../../utilities";
import {
  STUDENT_APPLICATION_EXCEPTION_INVALID_STATE,
  STUDENT_APPLICATION_EXCEPTION_NOT_FOUND,
} from "../../constants";

/**
 * Manages student applications exceptions detected upon full-time/part-time application
 * submission, usually related to documents uploaded that must be reviewed.
 */
@Injectable()
export class ApplicationExceptionService extends RecordDataModelService<ApplicationException> {
  constructor(private readonly connection: Connection) {
    super(connection.getRepository(ApplicationException));
  }

  /**
   * Creates student application exceptions to be assessed by the Ministry.
   * Exceptions are detected during full-time/part-time application submissions
   * and are usually related to documents uploaded that must be reviewed.
   * @param applicationId application that contains the exceptions.
   * @param exceptionNames unique identifier names for the exceptions.
   * @param auditUserId user that should be considered the one that is
   * causing the changes.
   * @returns created exception.
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

  /**
   * Get a student application expectation detected after the student application was
   * submitted, for instance, when there are documents to be reviewed.
   * @param exceptionId exception to be retrieved.
   * @returns student application expectation information.
   */
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
      .leftJoin("exception.exceptionNote", "exceptionNote")
      .where("exception.id = :exceptionId", { exceptionId })
      .getOne();
  }

  /**
   * Get a student application expectation detected after the student application was
   * submitted, for instance, when there are documents to be reviewed.
   * @param applicationId application associated with the exception.
   * @param status statuses to be filtered.
   * @returns student application expectation information.
   */
  async getExceptionsByApplicationId(
    applicationId: number,
    ...status: ApplicationExceptionStatus[]
  ): Promise<ApplicationException[]> {
    const query = this.repo
      .createQueryBuilder("exception")
      .select([
        "exception.id",
        "exception.exceptionStatus",
        "exception.createdAt",
      ])
      .innerJoin("exception.application", "application")
      .where("application.Id = :applicationId", { applicationId });
    if (status) {
      query.andWhere("exception.exceptionStatus IN (:...status)", { status });
    }
    return query.getMany();
  }

  /**
   * Updates the student application exception approving or denying it.
   * @param exceptionId exception to be assessed.
   * @param exceptionStatus status to be updated.
   * @param noteDescription approval or denial note.
   * @param auditUserId user that should be considered the one that is
   * causing the changes.
   * @returns updated student application exception.
   */
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
