import { Injectable } from "@nestjs/common";
import { Brackets, DataSource } from "typeorm";
import {
  RecordDataModelService,
  ApplicationException,
  ApplicationExceptionStatus,
  Note,
  NoteType,
  Student,
  User,
  getUserFullNameLikeSearch,
  ApplicationStatus,
} from "@sims/sims-db";
import {
  OrderByCondition,
  PaginatedResults,
  PaginationOptions,
} from "../../utilities";
import { CustomNamedError, FieldSortOrder } from "@sims/utilities";
import {
  STUDENT_APPLICATION_EXCEPTION_INVALID_STATE,
  STUDENT_APPLICATION_EXCEPTION_NOT_FOUND,
} from "../../constants";
import { NotificationActionsService } from "@sims/services/notifications";

/**
 * Manages student applications exceptions detected upon full-time/part-time application
 * submission, usually related to documents uploaded that must be reviewed.
 */
@Injectable()
export class ApplicationExceptionService extends RecordDataModelService<ApplicationException> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly notificationActionsService: NotificationActionsService,
  ) {
    super(dataSource.getRepository(ApplicationException));
  }

  /**
   * Get a student application exception detected after the student application was
   * submitted, for instance, when there are documents to be reviewed.
   * @param exceptionId exception to be retrieved.
   * @param options options for the query:
   * - `studentId` student id.
   * ` `applicationId` application id.
   * @returns student application exception information.
   */
  async getExceptionDetails(
    exceptionId: number,
    options?: {
      studentId?: number;
      applicationId?: number;
    },
  ): Promise<ApplicationException> {
    const exception = this.repo
      .createQueryBuilder("exception")
      .select([
        "exception.id",
        "exception.exceptionStatus",
        "exception.createdAt",
        "exception.assessedDate",
        "exceptionNote.description",
        "exceptionRequest.exceptionName",
        "assessedBy.firstName",
        "assessedBy.lastName",
      ])
      .innerJoin("exception.exceptionRequests", "exceptionRequest")
      .leftJoin("exception.exceptionNote", "exceptionNote")
      .leftJoin("exception.assessedBy", "assessedBy")
      .where("exception.id = :exceptionId", { exceptionId });

    if (options?.studentId || options?.applicationId) {
      exception.innerJoin("exception.application", "application");
    }

    if (options?.studentId) {
      exception
        .innerJoin("application.student", "student")
        .andWhere("student.id = :studentId", { studentId: options?.studentId });
    }

    if (options?.applicationId) {
      exception.andWhere("application.id = :applicationId", {
        applicationId: options?.applicationId,
      });
    }
    return exception.getOne();
  }

  /**
   * Get a student application exception detected after the student application was
   * submitted, for instance, when there are documents to be reviewed.
   * @param applicationId application associated with the exception.
   * @param studentId student id.
   * @param status statuses to be filtered.
   * @returns student application exception information.
   */
  async getExceptionsByApplicationId(
    applicationId: number,
    studentId?: number,
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
    if (studentId) {
      query
        .innerJoin("application.student", "student")
        .andWhere("student.id = :studentId", { studentId });
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
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const applicationExceptionRepo =
        transactionalEntityManager.getRepository(ApplicationException);
      const exceptionToUpdate = await applicationExceptionRepo
        .createQueryBuilder("exception")
        .select([
          "exception.id",
          "exception.exceptionStatus",
          "application.id",
          "student.id",
          "user.id",
          "user.firstName",
          "user.lastName",
          "user.email",
        ])
        .innerJoin("exception.application", "application")
        .innerJoin("application.student", "student")
        .innerJoin("student.user", "user")
        .where("exception.id = :exceptionId", { exceptionId })
        .andWhere("application.applicationStatus != :applicationStatus", {
          applicationStatus: ApplicationStatus.Edited,
        })
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
      const now = new Date();
      // Create the note to be associated with the update.
      const newNote = new Note();
      newNote.description = noteDescription;
      newNote.noteType = NoteType.Application;
      newNote.creator = auditUser;
      newNote.createdAt = now;
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
      exceptionToUpdate.assessedDate = now;
      exceptionToUpdate.modifier = auditUser;
      exceptionToUpdate.updatedAt = now;

      const exception = await applicationExceptionRepo.save(exceptionToUpdate);

      // Create a student notification when ministry completes an exception.
      const studentUser = exceptionToUpdate.application.student.user;
      await this.notificationActionsService.saveExceptionCompleteNotification(
        {
          givenNames: studentUser.firstName,
          lastName: studentUser.lastName,
          toAddress: studentUser.email,
          userId: studentUser.id,
        },
        auditUserId,
        transactionalEntityManager,
      );
      return exception;
    });
  }

  /**
   * Gets all pending students application exceptions.
   * @param paginationOptions options to execute the pagination.
   * @returns list of pending student application exceptions.
   */
  async getPendingApplicationExceptions(
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResults<ApplicationException>> {
    const applicationExceptionsQuery = this.repo
      .createQueryBuilder("exception")
      .select([
        "exception.id",
        "exception.createdAt",
        "application.id",
        "application.applicationNumber",
        "user.firstName",
        "user.lastName",
        "student.id",
      ])
      .innerJoin("exception.application", "application")
      .innerJoin("application.student", "student")
      .innerJoin("student.user", "user")
      .where("exception.exceptionStatus = :exceptionStatus", {
        exceptionStatus: ApplicationExceptionStatus.Pending,
      })
      .andWhere("application.applicationStatus != :applicationStatus", {
        applicationStatus: ApplicationStatus.Edited,
      });

    if (paginationOptions.searchCriteria) {
      applicationExceptionsQuery
        .andWhere(
          new Brackets((qb) => {
            qb.where(getUserFullNameLikeSearch()).orWhere(
              "application.applicationNumber Ilike :searchCriteria",
            );
          }),
        )
        .setParameter(
          "searchCriteria",
          `%${paginationOptions.searchCriteria.trim()}%`,
        );
    }

    applicationExceptionsQuery
      .orderBy(
        this.transformToEntitySortField(
          paginationOptions.sortField,
          paginationOptions.sortOrder,
        ),
      )
      .offset(paginationOptions.page * paginationOptions.pageLimit)
      .limit(paginationOptions.pageLimit);

    const [result, count] = await applicationExceptionsQuery.getManyAndCount();
    return {
      results: result,
      count: count,
    };
  }

  /**
   * Transformation to convert the data table column name to database column name.
   * Any changes to the data object (e.g data table) in presentation layer must be adjusted here.
   * @param sortField database fields to be sorted.
   * @param sortOrder sort order of fields (Ascending or Descending order).
   * @returns OrderByCondition
   */
  private transformToEntitySortField(
    sortField = "submittedDate",
    sortOrder = FieldSortOrder.ASC,
  ): OrderByCondition {
    const orderByCondition = {};

    const fieldSortOptions = {
      applicationNumber: "application.applicationNumber",
      submittedDate: "exception.createdAt",
      givenNames: "user.firstName",
      lastName: "user.lastName",
    };

    const dbColumnName = fieldSortOptions[sortField];
    orderByCondition[dbColumnName] = sortOrder;
    return orderByCondition;
  }
}
