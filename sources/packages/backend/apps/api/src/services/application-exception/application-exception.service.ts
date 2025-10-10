import { Injectable } from "@nestjs/common";
import { Brackets, DataSource } from "typeorm";
import {
  RecordDataModelService,
  ApplicationException,
  ApplicationExceptionStatus,
  NoteType,
  User,
  getUserFullNameLikeSearch,
  ApplicationStatus,
  ApplicationExceptionRequestStatus,
  ApplicationExceptionRequest,
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
import { AssessedExceptionRequest } from "..";
import { NoteSharedService } from "@sims/services";

/**
 * Manages student applications exceptions detected upon full-time/part-time application
 * submission, usually related to documents uploaded that must be reviewed.
 */
@Injectable()
export class ApplicationExceptionService extends RecordDataModelService<ApplicationException> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly notificationActionsService: NotificationActionsService,
    private readonly noteSharedService: NoteSharedService,
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
        "exceptionRequest.id",
        "exceptionRequest.exceptionName",
        "exceptionRequest.exceptionDescription",
        "exceptionRequest.exceptionRequestStatus",
        "approvalExceptionRequest.id",
        "approvalApplicationException.id",
        "approvalApplicationException.assessedDate",
        "assessedBy.firstName",
        "assessedBy.lastName",
      ])
      .innerJoin("exception.exceptionRequests", "exceptionRequest")
      .leftJoin(
        "exceptionRequest.approvalExceptionRequest",
        "approvalExceptionRequest",
      )
      .leftJoin(
        "approvalExceptionRequest.applicationException",
        "approvalApplicationException",
      )
      .leftJoin("exception.exceptionNote", "exceptionNote")
      .leftJoin("exception.assessedBy", "assessedBy")
      .where("exception.id = :exceptionId", { exceptionId })
      .orderBy("exceptionRequest.exceptionDescription", "ASC");

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
   * @param assessedExceptionRequests assessed exception requests to be updated.
   * @param noteDescription approval or denial note.
   * @param auditUserId user that should be considered the one that is
   * causing the changes.
   * @returns updated student application exception status and application id.
   */
  async approveException(
    exceptionId: number,
    assessedExceptionRequests: AssessedExceptionRequest[],
    noteDescription: string,
    auditUserId: number,
  ): Promise<{
    applicationId: number;
    exceptionStatus: ApplicationExceptionStatus;
  }> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const applicationExceptionRepo =
        transactionalEntityManager.getRepository(ApplicationException);
      const applicationException = await applicationExceptionRepo
        .createQueryBuilder("exception")
        .select([
          "exception.id",
          "exception.exceptionStatus",
          "exceptionRequest.id",
          "exceptionRequest.exceptionRequestStatus",
          "application.id",
          "student.id",
          "user.id",
          "user.firstName",
          "user.lastName",
          "user.email",
        ])
        .innerJoin("exception.exceptionRequests", "exceptionRequest")
        .innerJoin("exception.application", "application")
        .innerJoin("application.student", "student")
        .innerJoin("student.user", "user")
        .where("exception.id = :exceptionId", { exceptionId })
        .andWhere("application.applicationStatus != :applicationStatus", {
          applicationStatus: ApplicationStatus.Edited,
        })
        .getOne();

      if (!applicationException) {
        throw new CustomNamedError(
          "Student application exception not found.",
          STUDENT_APPLICATION_EXCEPTION_NOT_FOUND,
        );
      }

      if (
        applicationException.exceptionStatus !==
        ApplicationExceptionStatus.Pending
      ) {
        throw new CustomNamedError(
          `Student application exception must be in ${ApplicationExceptionStatus.Pending} state to be assessed.`,
          STUDENT_APPLICATION_EXCEPTION_INVALID_STATE,
        );
      }
      const assessedExceptionRequestIds = assessedExceptionRequests.map(
        (request) => request.exceptionRequestId,
      );
      // Validate all the exception requests to be updated.
      this.validateExceptionsRequestsToUpdate(
        assessedExceptionRequestIds,
        applicationException,
      );

      const auditUser = { id: auditUserId } as User;
      const now = new Date();
      // Update all the exception requests to be approved or declined.
      const exceptionRequestsToUpdate = assessedExceptionRequests.map(
        (assessedExceptionRequest) =>
          ({
            id: assessedExceptionRequest.exceptionRequestId,
            exceptionRequestStatus:
              assessedExceptionRequest.exceptionRequestStatus,
            modifier: auditUser,
            updatedAt: now,
          }) as ApplicationExceptionRequest,
      );
      await transactionalEntityManager
        .getRepository(ApplicationExceptionRequest)
        .save(exceptionRequestsToUpdate);
      // Create the note to be associated with the application exception update.
      const exceptionNote = await this.noteSharedService.createStudentNote(
        applicationException.application.student.id,
        NoteType.Application,
        noteDescription,
        auditUserId,
        transactionalEntityManager,
      );
      // Derive the application exception status based on the exception requests status.
      // If all exception requests are approved, the exception is approved.
      // If at least one exception request is declined, the exception is declined.
      const exceptionStatus = assessedExceptionRequests.every(
        (request) =>
          request.exceptionRequestStatus ===
          ApplicationExceptionRequestStatus.Approved,
      )
        ? ApplicationExceptionStatus.Approved
        : ApplicationExceptionStatus.Declined;

      const result = await applicationExceptionRepo.update(
        {
          id: exceptionId,
          exceptionStatus: ApplicationExceptionStatus.Pending,
        },
        {
          exceptionStatus,
          exceptionNote,
          assessedBy: auditUser,
          assessedDate: now,
          modifier: auditUser,
          updatedAt: now,
        },
      );
      if (!result.affected) {
        throw new CustomNamedError(
          `Student application exception ${exceptionId} not updated.`,
          STUDENT_APPLICATION_EXCEPTION_INVALID_STATE,
        );
      }

      // Create a student notification when ministry completes an exception.
      const studentUser = applicationException.application.student.user;
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
      return {
        applicationId: applicationException.application.id,
        exceptionStatus,
      };
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

  /**
   * Validates the exception requests to be updated as approved or declined.
   * @param assessedExceptionRequestIds assessed exception request ids.
   * @param applicationException application exception to validate against.
   * @throws {CustomNamedError} when all the assessed exception requests
   * are not valid to be updated as approved or declined for the application exception.
   */
  private validateExceptionsRequestsToUpdate(
    assessedExceptionRequestIds: number[],
    applicationException: ApplicationException,
  ): void {
    // If there are no pending exception requests to be updated
    // for the application exception, throw an error.
    const pendingExceptionRequestsToUpdate =
      applicationException.exceptionRequests.filter(
        (request) =>
          request.exceptionRequestStatus ===
          ApplicationExceptionRequestStatus.Pending,
      );

    if (!pendingExceptionRequestsToUpdate.length) {
      throw new CustomNamedError(
        `There is no pending exception request to updated for the student application exception ${applicationException.id}.`,
        STUDENT_APPLICATION_EXCEPTION_INVALID_STATE,
      );
    }

    // Check if the exception requests to updated as approved or declined
    // are exactly the same exception requests that are pending for the application exception.
    if (
      assessedExceptionRequestIds.length !==
        pendingExceptionRequestsToUpdate.length ||
      pendingExceptionRequestsToUpdate.some(
        (request) => !assessedExceptionRequestIds.includes(request.id),
      )
    ) {
      throw new CustomNamedError(
        `The exception requests to be updated does not match all the pending exception requests for the student application exception ${applicationException.id}.`,
        STUDENT_APPLICATION_EXCEPTION_INVALID_STATE,
      );
    }
  }
}
