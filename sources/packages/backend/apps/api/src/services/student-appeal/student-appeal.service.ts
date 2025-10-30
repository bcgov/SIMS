import { Injectable } from "@nestjs/common";
import {
  Brackets,
  DataSource,
  EntityManager,
  IsNull,
  MoreThanOrEqual,
  Repository,
} from "typeorm";
import {
  RecordDataModelService,
  Application,
  StudentAppeal,
  StudentAppealRequest,
  StudentAppealStatus,
  User,
  mapFromRawAndEntities,
  getUserFullNameLikeSearch,
  FileOriginType,
  ApplicationStatus,
  OfferingIntensity,
  Student,
} from "@sims/sims-db";
import {
  AppealType,
  PendingAndDeniedAppeals,
  StudentAppealRequestModel,
  StudentAppealWithStatus,
} from "./student-appeal.model";
import { StudentAppealRequestsService } from "../student-appeal-request/student-appeal-request.service";
import {
  PaginatedResults,
  SortPriority,
  OrderByCondition,
  StudentAppealPaginationOptions,
} from "../../utilities";
import { FieldSortOrder } from "@sims/utilities";
import { PROGRAM_YEAR_2025_26_START_DATE } from "./constants";
import {
  NotificationActionsService,
  StudentSubmittedChangeRequestNotification,
} from "@sims/services/notifications";
import { StudentFileService } from "../student-file/student-file.service";
import { InjectRepository } from "@nestjs/typeorm";

/**
 * Service layer for Student appeals.
 */
@Injectable()
export class StudentAppealService extends RecordDataModelService<StudentAppeal> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly studentAppealRequestsService: StudentAppealRequestsService,
    private readonly notificationActionsService: NotificationActionsService,
    private readonly studentFileService: StudentFileService,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
  ) {
    super(dataSource.getRepository(StudentAppeal));
  }

  /**
   * Save student appeals that are requested by the student,
   * update student files if exist and save a notification for the
   * ministry using the same transaction.
   * @param applicationId application to which an appeal is submitted.
   * @param auditUserId student user who submits the appeal.
   * @param studentId student Id.
   * @param studentAppealRequests payload data.
   */
  async saveStudentAppeals(
    studentId: number,
    studentAppealRequests: StudentAppealRequestModel[],
    auditUserId: number,
    applicationId?: number,
  ): Promise<StudentAppeal> {
    return this.dataSource.transaction(async (entityManager) => {
      const studentAppeal = new StudentAppeal();
      const currentDateTime = new Date();
      const creator = { id: auditUserId } as User;
      studentAppeal.application = { id: applicationId } as Application;
      studentAppeal.student = { id: studentId } as Student;
      studentAppeal.creator = creator;
      studentAppeal.createdAt = currentDateTime;
      studentAppeal.submittedDate = currentDateTime;
      studentAppeal.appealRequests = studentAppealRequests.map(
        (appealRequest) =>
          ({
            submittedFormName: appealRequest.formName,
            submittedData: appealRequest.formData,
            appealStatus: StudentAppealStatus.Pending,
            creator: creator,
            createdAt: currentDateTime,
          }) as StudentAppealRequest,
      );
      const uniqueFileNames: string[] = studentAppealRequests.flatMap(
        (studentAppeal) => studentAppeal.files,
      );
      if (uniqueFileNames.length) {
        await this.studentFileService.updateStudentFiles(
          studentId,
          auditUserId,
          uniqueFileNames,
          FileOriginType.Appeal,
          { entityManager: entityManager },
        );
      }
      await entityManager.getRepository(StudentAppeal).save(studentAppeal);
      await this.createStudentAppealNotification(
        studentAppeal.id,
        entityManager,
      );
      return studentAppeal;
    });
  }

  /**
   * Create a notification for the student appeal.
   * @param appealId appeal ID to send the notification.
   * @param entityManager entity manager to keep DB operations in the same transaction.
   */
  private async createStudentAppealNotification(
    appealId: number,
    entityManager: EntityManager,
  ): Promise<void> {
    const studentAppeal = await entityManager
      .getRepository(StudentAppeal)
      .findOne({
        select: {
          id: true,
          student: {
            id: true,
            user: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
            birthDate: true,
          },
          application: { id: true, applicationNumber: true },
        },
        relations: { student: { user: true }, application: true },
        where: { id: appealId },
        loadEagerRelations: false,
      });
    const ministryNotification: StudentSubmittedChangeRequestNotification = {
      givenNames: studentAppeal.student.user.firstName,
      lastName: studentAppeal.student.user.lastName,
      email: studentAppeal.student.user.email,
      birthDate: studentAppeal.student.birthDate,
      applicationNumber:
        studentAppeal.application?.applicationNumber ?? "not applicable",
    };
    return this.notificationActionsService.saveStudentSubmittedChangeRequestNotification(
      ministryNotification,
      entityManager,
    );
  }

  /**
   * Checks if a student appeal exists.
   * @param studentId student ID related to the appeal.
   * @param options query options.
   * - `appealFormName` form name of the appeal request to be checked.
   * - `isStudentOnlyAppeal` flag to indicate if the appeal must not be associated with an application.
   * - `applicationId` application ID related to the appeal to be checked. Ignored if `isStudentOnlyAppeal` is true.
   * - `appealStatus` status of the appeal request to be checked.
   * @returns true if exists, false otherwise.
   */
  async hasAppeal(
    studentId: number,
    options?: {
      appealFormName?: string;
      isStudentOnlyAppeal?: boolean;
      applicationId?: number;
      appealStatus?: StudentAppealStatus;
    },
  ): Promise<boolean> {
    return this.repo.exists({
      where: {
        student: { id: studentId },
        application: {
          id: options?.isStudentOnlyAppeal ? IsNull() : options?.applicationId,
        },
        appealRequests: {
          submittedFormName: options?.appealFormName,
          appealStatus: options?.appealStatus,
        },
      },
    });
  }

  /**
   * Get all pending and declined student Appeals
   * for an application.
   * Here we have added different when statement
   * in CASE to fetch the status of the appeals.
   * * WHEN: is checking if at least one Pending
   * * appeals request is there for an appeal,
   * * then the status is considered as Pending.
   * * END: if any of them is not falling
   * * under above case and applying the andWhere
   * * condition, we get Declined.
   * * andWhere: will only take Pending and
   * * Declined status.
   * @param applicationId application id.
   * @param studentId applicant student.
   * @returns StudentAppeal list.
   */
  async getPendingAndDeniedAppeals(
    applicationId: number,
    studentId?: number,
  ): Promise<PendingAndDeniedAppeals[]> {
    const query = this.repo
      .createQueryBuilder("studentAppeal")
      .select(["studentAppeal.id", "studentAppeal.submittedDate"])
      .addSelect(
        `CASE
            WHEN EXISTS(${this.studentAppealRequestsService
              .appealsByStatusQueryObject(StudentAppealStatus.Pending)
              .getSql()}) THEN '${StudentAppealStatus.Pending}'
            ELSE '${StudentAppealStatus.Declined}'
        END`,
        "status",
      )
      .innerJoin("studentAppeal.application", "application")
      .where("application.id = :applicationId", { applicationId })
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            ` EXISTS(${this.studentAppealRequestsService
              .appealsByStatusQueryObject(StudentAppealStatus.Pending)
              .getSql()})`,
          ).orWhere(
            `NOT EXISTS(${this.studentAppealRequestsService
              .appealsByStatusQueryObject(StudentAppealStatus.Declined, false)
              .getSql()})`,
          );
        }),
      );
    if (studentId) {
      query.andWhere("application.student.id = :studentId", {
        studentId,
      });
    }
    const queryResult = await query
      .orderBy(
        `CASE 
          WHEN EXISTS(${this.studentAppealRequestsService
            .appealsByStatusQueryObject(StudentAppealStatus.Pending)
            .getSql()}) THEN ${SortPriority.Priority1}
              ELSE ${SortPriority.Priority2}
            END`,
      )
      .addOrderBy("studentAppeal.submittedDate", "DESC")
      .getRawAndEntities();
    return mapFromRawAndEntities<PendingAndDeniedAppeals>(
      queryResult,
      "status",
    );
  }

  /**
   * Get the student appeal and its requests.
   * @param appealId appeal if to be retrieved.
   * @param options options for the query:
   * - `studentId` applicant student.
   * - `applicationId` application id.
   * @returns student appeal and its requests.
   */
  async getAppealAndRequestsById(
    appealId: number,
    options?: {
      studentId?: number;
      applicationId?: number;
    },
  ): Promise<StudentAppealWithStatus> {
    const query = this.repo
      .createQueryBuilder("studentAppeal")
      .select([
        "studentAppeal.id",
        "studentAppeal.submittedDate",
        "appealRequest.id",
        "appealRequest.submittedData",
        "appealRequest.submittedFormName",
        "appealRequest.appealStatus",
        "appealRequest.assessedDate",
        "user.firstName",
        "user.lastName",
        "note.description",
      ])
      .addSelect(this.buildStatusSelect(), "status")
      .innerJoin("studentAppeal.appealRequests", "appealRequest")
      .innerJoin("studentAppeal.student", "student")
      .leftJoin("studentAppeal.application", "application")
      .leftJoin("appealRequest.assessedBy", "user")
      .leftJoin("appealRequest.note", "note")
      .where("studentAppeal.id = :appealId", { appealId });

    if (options?.studentId) {
      query.andWhere("student.id = :studentId", {
        studentId: options.studentId,
      });
    }
    if (options?.applicationId) {
      query.andWhere("application.id = :applicationId", {
        applicationId: options.applicationId,
      });
    }
    const queryResult = await query.getRawAndEntities();

    const [appealWithStatus] = mapFromRawAndEntities<StudentAppealWithStatus>(
      queryResult,
      "status",
    );
    return appealWithStatus;
  }

  /**
   * Get all applications eligible for appeal for a specific student.
   * @param studentId student ID.
   * @param options query options.
   * - `applicationId` application ID. Allow checking if a specific
   * application is eligible for appeal.
   * @returns list of eligible applications.
   */
  async getEligibleApplicationsForAppeal(
    studentId: number,
    options?: { applicationId?: number },
  ): Promise<Application[]> {
    return this.applicationRepo.find({
      select: { id: true, applicationNumber: true },
      where: {
        id: options?.applicationId,
        student: { id: studentId, sinValidation: { isValidSIN: true } },
        applicationStatus: ApplicationStatus.Completed,
        offeringIntensity: OfferingIntensity.fullTime,
        isArchived: false,
        programYear: {
          startDate: MoreThanOrEqual(PROGRAM_YEAR_2025_26_START_DATE),
        },
      },
      order: { applicationNumber: "ASC" },
    });
  }

  /**
   * Get student appeals and their status.
   * @param applicationId application id.
   * @param studentId student id.
   * @param options query options
   * - `studentId` student id.
   * - `limit` limit of records to be retrieved.
   * @returns student appeals and their status.
   */
  async getAppealsForApplication(
    applicationId: number,
    options?: {
      studentId?: number;
      limit?: number;
    },
  ): Promise<StudentAppealWithStatus[]> {
    const query = this.repo
      .createQueryBuilder("studentAppeal")
      .select(["studentAppeal.id"])
      .addSelect(this.buildStatusSelect(), "status")
      .innerJoin("studentAppeal.application", "application")
      .where("application.id = :applicationId", { applicationId });

    if (options?.studentId) {
      query.andWhere("application.student.id = :studentId", {
        studentId: options.studentId,
      });
    }

    query.orderBy("studentAppeal.submittedDate", "DESC");

    if (options?.limit) {
      query.limit(options.limit);
    }

    const queryResult = await query.getRawAndEntities();
    return mapFromRawAndEntities<StudentAppealWithStatus>(
      queryResult,
      "status",
    );
  }

  /**
   * Builds the conditions to define the status of a student appeal
   * based on the statuses of its appeal requests.
   * @returns SQL select to be used in a query to return the appeal status.
   */
  private buildStatusSelect(): string {
    return `CASE
      WHEN EXISTS(${this.studentAppealRequestsService
        .appealsByStatusQueryObject(StudentAppealStatus.Pending)
        .getSql()}) THEN '${StudentAppealStatus.Pending}'
      WHEN EXISTS(${this.studentAppealRequestsService
        .appealsByStatusQueryObject(StudentAppealStatus.Approved)
        .getSql()}) THEN '${StudentAppealStatus.Approved}'
      ELSE '${StudentAppealStatus.Declined}'
    END`;
  }

  /**
   * Get all pending student appeals.
   * @param paginationOptions options to execute the pagination.
   * @param status appeal status.
   * @returns StudentAppeal list.
   */
  async getAppealsByStatus(
    paginationOptions: StudentAppealPaginationOptions,
    status: StudentAppealStatus,
  ): Promise<PaginatedResults<StudentAppeal>> {
    const {
      page,
      pageLimit,
      sortField,
      sortOrder,
      appealType,
      searchCriteria,
    } = paginationOptions;
    const studentAppealsQuery = this.repo
      .createQueryBuilder("studentAppeal")
      .select([
        "studentAppeal.id",
        "application.id",
        "studentAppeal.submittedDate",
        "user.firstName",
        "user.lastName",
        "application.applicationNumber",
        "student.id",
      ])
      .innerJoin("studentAppeal.student", "student")
      .innerJoin("student.user", "user")
      .leftJoin("studentAppeal.application", "application")
      .leftJoin("application.programYear", "programYear")
      .where(
        `EXISTS(${this.studentAppealRequestsService
          .appealsByStatusQueryObject(status)
          .getSql()})`,
      );
    // Filter by program year start date based on appeal type.
    if (appealType === AppealType.LegacyChangeRequest) {
      studentAppealsQuery.andWhere(
        new Brackets((qb) =>
          qb
            // Ensure only retrieving appeals for students where applications are associated.
            .where("programYear.startDate IS NOT NULL")
            // If an application is associated, only appeals for programs starting
            // before the defined date are allowed.
            .andWhere("programYear.startDate < :programStartDate", {
              programStartDate: PROGRAM_YEAR_2025_26_START_DATE,
            }),
        ),
      );
    } else if (appealType === AppealType.Appeal) {
      studentAppealsQuery.andWhere(
        new Brackets((qb) =>
          qb
            // Allow retrieving appeals for students where applications are not associated.
            .where("programYear.startDate IS NULL")
            // If an application is associated, only appeals for programs starting
            // on or after the defined date are allowed.
            .orWhere("programYear.startDate >= :programStartDate", {
              programStartDate: PROGRAM_YEAR_2025_26_START_DATE,
            }),
        ),
      );
    }

    // Apply text search if present
    if (searchCriteria) {
      studentAppealsQuery
        .andWhere(
          new Brackets((qb) => {
            qb.where(getUserFullNameLikeSearch()).orWhere(
              "application.applicationNumber Ilike :searchCriteria",
            );
          }),
        )
        .setParameter("searchCriteria", `%${searchCriteria}%`);
    }

    studentAppealsQuery
      .orderBy(this.transformToEntitySortField(sortField, sortOrder))
      .offset(page * pageLimit)
      .limit(pageLimit);

    const [result, count] = await studentAppealsQuery.getManyAndCount();
    return {
      results: result,
      count: count,
    };
  }

  /**
   * Get all the appeals submitted by a student.
   * @param studentId student ID.
   * @returns list of student appeals.
   */
  async getAppealsByStudentId(studentId: number): Promise<StudentAppeal[]> {
    return this.repo.find({
      select: {
        id: true,
        submittedDate: true,
        appealRequests: {
          id: true,
          submittedFormName: true,
          appealStatus: true,
          assessedDate: true,
        },
        application: { id: true, applicationNumber: true },
      },
      relations: { application: true, appealRequests: true },
      where: [
        { student: { id: studentId }, application: IsNull() },
        // Exclude the legacy change requests when fetching appeals associated with applications.
        {
          student: { id: studentId },
          application: {
            programYear: {
              startDate: MoreThanOrEqual(PROGRAM_YEAR_2025_26_START_DATE),
            },
          },
        },
      ],
      order: { submittedDate: "DESC" },
    });
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
      submittedDate: "studentAppeal.submittedDate",
      lastName: "user.lastName",
    };

    const dbColumnName = fieldSortOptions[sortField];
    orderByCondition[dbColumnName] = sortOrder;
    return orderByCondition;
  }
}
