import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Application,
  ApplicationOfferingChangeRequest,
  ApplicationOfferingChangeRequestStatus,
  ApplicationStatus,
  EducationProgramOffering,
  User,
  getUserFullNameLikeSearch,
  transformToApplicationEntitySortField,
} from "@sims/sims-db";
import { DataSource, Brackets, Repository, In } from "typeorm";
import { PaginatedResults, PaginationOptions } from "../../utilities";
import { NotificationActionsService, SystemUsersService } from "@sims/services";
import { StudentApplicationOfferingChangeRequest } from "../../route-controllers/application-offering-change-request/models/application-offering-change-request.models";

@Injectable()
export class ApplicationOfferingChangeRequestService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    @InjectRepository(ApplicationOfferingChangeRequest)
    private readonly applicationOfferingChangeRequestRepo: Repository<ApplicationOfferingChangeRequest>,
    private readonly notificationActionsService: NotificationActionsService,
    private readonly systemUsersService: SystemUsersService,
  ) {}

  /**
   * Gets an eligible application that can be requested for application
   * offering change.
   * @param locationId location id.
   * @param options method options:
   * - `applicationId` specific eligible application to be retrieved.
   * @returns eligible application.
   */
  async getEligibleApplications(
    locationId: number,
    options: {
      applicationId: number;
    },
  ): Promise<Application>;
  /**
   * Gets all eligible applications that can be requested for application
   * offering change.
   * @param locationId location id.
   * @param options method options:
   * - `pagination` options to execute the pagination.
   * @returns list of eligible applications that can be requested for
   * application offering change.
   */
  async getEligibleApplications(
    locationId: number,
    options: {
      pagination: PaginationOptions;
    },
  ): Promise<PaginatedResults<Application>>;
  /**
   * Gets all eligible applications that can be requested for application
   * offering change.
   * @param locationId location id.
   * @param options method options:
   * - `pagination` options to execute the pagination.
   * - `applicationId` specific eligible application to be retrieved.
   * @returns list of eligible applications that can be requested for
   * application offering change.
   */
  async getEligibleApplications(
    locationId: number,
    options: {
      pagination?: PaginationOptions;
      applicationId?: number;
    },
  ): Promise<PaginatedResults<Application> | Application> {
    const applicationQuery = this.applicationRepo
      .createQueryBuilder("application")
      .select([
        "application.applicationNumber",
        "application.id",
        "programYear.id",
        "currentAssessment.id",
        "educationProgram.id",
        "offering.id",
        "offering.studyStartDate",
        "offering.studyEndDate",
        "offering.offeringIntensity",
        "student.id",
        "user.id",
        "user.firstName",
        "user.lastName",
        "user.email",
      ])
      .innerJoin("application.programYear", "programYear")
      .innerJoin("application.currentAssessment", "currentAssessment")
      .innerJoin("currentAssessment.offering", "offering")
      .innerJoin("offering.educationProgram", "educationProgram")
      .leftJoin(
        "application.applicationOfferingChangeRequest",
        "applicationOfferingChangeRequest",
        "applicationOfferingChangeRequest.applicationOfferingChangeRequestStatus IN (:...status)",
        {
          status: [
            ApplicationOfferingChangeRequestStatus.InProgressWithSABC,
            ApplicationOfferingChangeRequestStatus.InProgressWithStudent,
          ],
        },
      )
      .innerJoin("application.student", "student")
      .innerJoin("student.user", "user")
      .where("applicationOfferingChangeRequest.id IS NULL")
      .andWhere("application.location.id = :locationId", { locationId })
      .andWhere("application.applicationStatus = :applicationStatus", {
        applicationStatus: ApplicationStatus.Completed,
      })
      .andWhere("application.isArchived = false");

    if (options?.applicationId) {
      applicationQuery.andWhere("application.id = :applicationId", {
        applicationId: options.applicationId,
      });
      // If searching by application id there is no need for pagination.
      return applicationQuery.getOne();
    }

    if (options.pagination.searchCriteria?.trim()) {
      applicationQuery
        .andWhere(
          new Brackets((qb) => {
            qb.where(getUserFullNameLikeSearch()).orWhere(
              "application.applicationNumber Ilike :searchCriteria",
            );
          }),
        )
        .setParameter(
          "searchCriteria",
          `%${options.pagination.searchCriteria}%`,
        );
    }

    applicationQuery
      .orderBy(
        transformToApplicationEntitySortField(
          options.pagination.sortField,
          options.pagination.sortOrder,
        ),
      )
      .offset(options.pagination.page * options.pagination.pageLimit)
      .limit(options.pagination.pageLimit);

    const [result, count] = await applicationQuery.getManyAndCount();
    return {
      results: result,
      count,
    };
  }

  /**
   * Gets application offering request change list.
   * @param locationId location id.
   * @param paginationOptions options to execute the pagination.
   * @param statuses list of status that need to be included in the query.
   * @returns list of requested application offering changes.
   */
  async getSummaryByStatus(
    locationId: number,
    paginationOptions: PaginationOptions,
    statuses: ApplicationOfferingChangeRequestStatus[],
  ): Promise<PaginatedResults<ApplicationOfferingChangeRequest>> {
    const offeringChange = this.applicationOfferingChangeRequestRepo
      .createQueryBuilder("applicationOfferingChangeRequest")
      .select([
        "applicationOfferingChangeRequest.id",
        "applicationOfferingChangeRequest.applicationOfferingChangeRequestStatus",
        "applicationOfferingChangeRequest.assessedDate",
        "applicationOfferingChangeRequest.studentActionDate",
        "application.applicationNumber",
        "currentAssessment.id",
        "offering.studyStartDate",
        "offering.studyEndDate",
        "student.id",
        "user.firstName",
        "user.lastName",
      ])
      .innerJoin("applicationOfferingChangeRequest.application", "application")
      .innerJoin("application.currentAssessment", "currentAssessment")
      .innerJoin("currentAssessment.offering", "offering")
      .innerJoin("application.student", "student")
      .innerJoin("student.user", "user")
      .where("application.location.id = :locationId", { locationId })
      .andWhere(
        "applicationOfferingChangeRequest.applicationOfferingChangeRequestStatus IN (:...statuses)",
        {
          statuses,
        },
      );
    if (paginationOptions.searchCriteria?.trim()) {
      offeringChange
        .andWhere(
          new Brackets((qb) => {
            qb.where(getUserFullNameLikeSearch()).orWhere(
              "application.applicationNumber Ilike :searchCriteria",
            );
          }),
        )
        .setParameter(
          "searchCriteria",
          `%${paginationOptions.searchCriteria}%`,
        );
    }
    offeringChange
      .orderBy(
        transformToApplicationEntitySortField(
          paginationOptions.sortField,
          paginationOptions.sortOrder,
        ),
      )
      .offset(paginationOptions.page * paginationOptions.pageLimit)
      .limit(paginationOptions.pageLimit);
    const [result, count] = await offeringChange.getManyAndCount();
    return {
      results: result,
      count,
    };
  }

  /**
   * Get the Application Offering Change Request by its id.
   * @param id the Application Offering Change Request id.
   * @param options method options:
   * - `studentId`: student id for student authorization.
   * - `locationId`: location id for institution authorization.
   * @returns application offering change request.
   */
  async getById(
    id: number,
    options?: {
      studentId?: number;
      locationId?: number;
    },
  ): Promise<ApplicationOfferingChangeRequest> {
    return this.applicationOfferingChangeRequestRepo.findOne({
      select: {
        id: true,
        reason: true,
        applicationOfferingChangeRequestStatus: true,
        activeOffering: {
          id: true,
        },
        requestedOffering: {
          id: true,
          name: true,
          educationProgram: {
            id: true,
            name: true,
          },
        },
        application: {
          id: true,
          applicationNumber: true,
          location: {
            id: true,
            name: true,
          },
          student: {
            id: true,
            user: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        assessedNote: {
          id: true,
          description: true,
        },
      },
      relations: {
        application: {
          location: true,
          student: {
            user: true,
          },
        },
        activeOffering: true,
        requestedOffering: {
          educationProgram: true,
        },
        assessedNote: true,
      },
      where: {
        id,
        application: {
          location: { id: options?.locationId },
          student: { id: options?.studentId },
        },
      },
    });
  }

  /**
   * Get the Application Offering Change Request by the application id.
   * @param applicationId the application id.
   * @param studentId the student id.
   * @returns application offering change request status.
   */
  async getApplicationOfferingChangeRequest(
    applicationId: number,
    studentId: number,
  ): Promise<ApplicationOfferingChangeRequest> {
    const applicationOfferingChangeRequest =
      await this.applicationOfferingChangeRequestRepo.findOne({
        relations: {
          application: {
            student: true,
          },
        },
        where: {
          application: { id: applicationId, student: { id: studentId } },
        },
        order: {
          createdAt: "DESC",
        },
      });
    return applicationOfferingChangeRequest;
  }

  /**
   * Get the Application Offering Change Request Status by id.
   * @param applicationOfferingChangeRequestId the application offering change request id.
   * @param options method options:
   * - `studentId`: student id for student authorization.
   * @returns application offering change request status.
   */
  async getApplicationOfferingChangeRequestStatusById(
    applicationOfferingChangeRequestId: number,
    options?: {
      studentId: number;
    },
  ): Promise<ApplicationOfferingChangeRequestStatus> {
    const applicationOfferingChangeRequest =
      await this.applicationOfferingChangeRequestRepo.findOne({
        select: { id: true, applicationOfferingChangeRequestStatus: true },
        where: {
          id: applicationOfferingChangeRequestId,
          application: { student: { id: options?.studentId } },
        },
      });
    return applicationOfferingChangeRequest.applicationOfferingChangeRequestStatus;
  }

  /**
   * Get all the Application Offering Change Requests for the provided application id filtered by the application offering change request statuses.
   * @param applicationId the application id.
   * @param studentId the student id.
   * @param applicationOfferingChangeRequestStatuses list of application offering change request statuses.
   * @returns application offering change requests.
   */
  async getApplicationOfferingChangeRequestsByStatus(
    applicationId: number,
    studentId: number,
    applicationOfferingChangeRequestStatuses: ApplicationOfferingChangeRequestStatus[],
  ): Promise<ApplicationOfferingChangeRequest[]> {
    return this.applicationOfferingChangeRequestRepo.find({
      select: {
        id: true,
        applicationOfferingChangeRequestStatus: true,
        createdAt: true,
      },
      where: {
        applicationOfferingChangeRequestStatus: In(
          applicationOfferingChangeRequestStatuses,
        ),
        application: { id: applicationId, student: { id: studentId } },
      },
    });
  }

  /**
   * Creates a new application offering change request and saves an offering change request inprogress with student notification message to the database.
   * @param locationId location id used for authorization.
   * @param applicationId application that will have the change requested.
   * @param offeringId offering being requested to be changed.
   * @param reason reason provided by the institution to have the offering changed.
   * @param auditUserId used creating the request.
   * @returns created application offering change request.
   */
  async createRequest(
    locationId: number,
    applicationId: number,
    offeringId: number,
    reason: string,
    auditUserId: number,
  ): Promise<ApplicationOfferingChangeRequest> {
    // Validates if the application is eligible to have an offering request change created.
    const application = await this.getEligibleApplications(locationId, {
      applicationId,
    });
    if (!application) {
      throw new Error("Application not found or it is not eligible.");
    }
    const newRequest = new ApplicationOfferingChangeRequest();
    newRequest.application = application;
    newRequest.activeOffering = application.currentAssessment.offering;
    newRequest.requestedOffering = {
      id: offeringId,
    } as EducationProgramOffering;
    newRequest.creator = { id: auditUserId } as User;
    newRequest.applicationOfferingChangeRequestStatus =
      ApplicationOfferingChangeRequestStatus.InProgressWithStudent;
    newRequest.reason = reason;
    return this.dataSource.transaction(async (transactionEntityManager) => {
      const applicationOfferingChangeRequest = await transactionEntityManager
        .getRepository(ApplicationOfferingChangeRequest)
        .save(newRequest);
      const systemUser = await this.systemUsersService.systemUser();
      await this.notificationActionsService.saveApplicationOfferingChangeRequestInProgressWithStudent(
        {
          givenNames: application.student.user.firstName,
          lastName: application.student.user.lastName,
          toAddress: application.student.user.email,
          userId: application.student.user.id,
        },
        systemUser.id,
        transactionEntityManager,
      );
      return applicationOfferingChangeRequest;
    });
  }

  /**
   * Update the application offering change request status for the given application offering change request id.
   * @param applicationOfferingChangeRequestId application offering change request id for which to update the status.
   * @param payload the payload to be updated
   */
  async updateApplicationOfferingChangeRequestStatus(
    applicationOfferingChangeRequestId: number,
    payload: StudentApplicationOfferingChangeRequest,
  ): Promise<void> {
    await this.applicationOfferingChangeRequestRepo.update(
      {
        id: applicationOfferingChangeRequestId,
      },
      {
        applicationOfferingChangeRequestStatus:
          payload.applicationOfferingChangeRequestStatus,
        studentConsent: payload.studentConsent,
      },
    );
  }
}
