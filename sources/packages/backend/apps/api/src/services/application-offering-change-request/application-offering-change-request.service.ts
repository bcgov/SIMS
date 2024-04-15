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
  transformToApplicationOfferingChangeEntitySortField,
  transformToApplicationEntitySortField,
  NoteType,
  AssessmentTriggerType,
  StudentAssessment,
  StudentAppeal,
} from "@sims/sims-db";
import { DataSource, Brackets, Repository, In } from "typeorm";
import { PaginatedResults, PaginationOptions } from "../../utilities";
import {
  ApplicationOfferingChangeRequestApprovedByStudentNotification,
  NoteSharedService,
  NotificationActionsService,
  SystemUsersService,
} from "@sims/services";

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
    private readonly noteSharedService: NoteSharedService,
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
   * @param statuses list of status that need to be included in the query.
   * @param paginationOptions options to execute the pagination.
   * @param options method options:
   * - `locationId`: location for authorization.
   * - `useApplicationSort`: true in case of sorting by applicationNumber or fullName,
   *  false in case of sorting by status or dateSubmitted.
   * @returns list of requested application offering changes.
   */
  async getSummaryByStatus(
    statuses: ApplicationOfferingChangeRequestStatus[],
    paginationOptions: PaginationOptions,
    options?: {
      locationId?: number;
      useApplicationSort?: boolean;
    },
  ): Promise<PaginatedResults<ApplicationOfferingChangeRequest>> {
    const offeringChange = this.applicationOfferingChangeRequestRepo
      .createQueryBuilder("applicationOfferingChangeRequest")
      .select([
        "applicationOfferingChangeRequest.id",
        "applicationOfferingChangeRequest.applicationOfferingChangeRequestStatus",
        "applicationOfferingChangeRequest.assessedDate",
        "applicationOfferingChangeRequest.studentActionDate",
        "applicationOfferingChangeRequest.createdAt",
        "application.id",
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
      .where(
        "applicationOfferingChangeRequest.applicationOfferingChangeRequestStatus IN (:...statuses)",
        {
          statuses,
        },
      );
    if (options?.locationId) {
      offeringChange.andWhere("application.location.id = :locationId", {
        locationId: options?.locationId,
      });
    }
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
    if (options?.useApplicationSort) {
      offeringChange.orderBy(
        transformToApplicationEntitySortField(
          paginationOptions.sortField,
          paginationOptions.sortOrder,
        ),
      );
    } else {
      offeringChange.orderBy(
        transformToApplicationOfferingChangeEntitySortField(
          paginationOptions.sortField,
          paginationOptions.sortOrder,
        ),
      );
    }
    offeringChange
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
        createdAt: true,
        studentActionDate: true,
        assessedDate: true,
        assessedBy: { id: true, firstName: true, lastName: true },
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
            institution: { id: true, operatingName: true },
          },
          student: {
            id: true,
            user: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          currentAssessment: { id: true, studentAppeal: { id: true } },
        },
        assessedNote: {
          id: true,
          description: true,
        },
      },
      relations: {
        application: {
          location: { institution: true },
          student: {
            user: true,
          },
          currentAssessment: { studentAppeal: true },
        },
        activeOffering: true,
        requestedOffering: {
          educationProgram: true,
        },
        assessedBy: true,
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
        select: {
          id: true,
          applicationOfferingChangeRequestStatus: true,
          createdAt: true,
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
    return applicationOfferingChangeRequest?.applicationOfferingChangeRequestStatus;
  }

  /**
   * Get all the Application Offering Change Requests for the provided application id filtered by the application offering change request statuses.
   * @param applicationId the application id.
   * @param applicationOfferingChangeRequestStatuses list of application offering change request statuses.
   * @param options method options:
   * `studentId`: student id for authorization.
   * @returns application offering change requests.
   */
  async getApplicationOfferingChangeRequestsByStatus(
    applicationId: number,
    applicationOfferingChangeRequestStatuses: ApplicationOfferingChangeRequestStatus[],
    options?: {
      studentId?: number;
    },
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
        application: { id: applicationId, student: { id: options?.studentId } },
      },
    });
  }

  /**
   * Validates the application offering change request for the given student and application offering change request status.
   * @param applicationOfferingChangeId application offering change request id.
   * @param options method options:
   * `studentId`: student id for authorization.
   * `applicationOfferingChangeRequestStatus`: application offering change request status for authorization.
   * @returns true if the student is authorized for the given application offering change request status.
   */
  async applicationOfferingChangeRequestExists(
    applicationOfferingChangeId: number,
    options?: {
      studentId?: number;
      applicationOfferingChangeRequestStatus?: ApplicationOfferingChangeRequestStatus;
    },
  ): Promise<boolean> {
    return this.applicationOfferingChangeRequestRepo.exist({
      where: {
        id: applicationOfferingChangeId,
        applicationOfferingChangeRequestStatus:
          options?.applicationOfferingChangeRequestStatus,
        application: {
          applicationStatus: ApplicationStatus.Completed,
          student: { id: options?.studentId },
        },
      },
    });
  }

  /** Validates student authorization for the given education program offering.
   * @param offeringId offering id.
   * @param studentId student id.
   * @returns true if the student is authorized for the given offering, otherwise false.
   */
  async validateApplicationOfferingForStudent(
    offeringId: number,
    studentId: number,
  ): Promise<boolean> {
    return this.applicationOfferingChangeRequestRepo.exist({
      where: [
        {
          application: { student: { id: studentId } },
          activeOffering: { id: offeringId },
        },
        {
          application: { student: { id: studentId } },
          requestedOffering: { id: offeringId },
        },
      ],
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
      const systemUser = this.systemUsersService.systemUser;
      await this.notificationActionsService.saveApplicationOfferingChangeRequestInProgressWithStudentNotification(
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
   * Update the application offering change request status for the given application offering change request id and
   * saves a notification for the ministry if the student approves the application offering change request at their end
   * as a part of the same transaction.
   * @param applicationOfferingChangeRequestId application offering change request id for which to update the status.
   * @param applicationOfferingChangeRequestStatus the application offering change request status to be updated.
   * @param studentConsent student consent to approve the application offering change request.
   * @param auditUserId user that should be considered the one that is causing the changes.
   */
  async updateApplicationOfferingChangeRequest(
    applicationOfferingChangeRequestId: number,
    applicationOfferingChangeRequestStatus: ApplicationOfferingChangeRequestStatus,
    studentConsent: boolean,
    auditUserId: number,
  ): Promise<void> {
    const auditUser = { id: auditUserId } as User;
    const currentDate = new Date();
    const applicationOfferingChangeRequestDetails =
      await this.applicationOfferingChangeRequestRepo.findOne({
        select: {
          id: true,
          application: {
            id: true,
            applicationNumber: true,
            student: {
              id: true,
              birthDate: true,
              user: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        relations: { application: { student: { user: true } } },
        where: { id: applicationOfferingChangeRequestId },
      });
    const student = applicationOfferingChangeRequestDetails.application.student;
    const ministryNotification: ApplicationOfferingChangeRequestApprovedByStudentNotification =
      {
        givenNames: student.user.firstName,
        lastName: student.user.lastName,
        email: student.user.email,
        dob: student.birthDate,
        applicationNumber:
          applicationOfferingChangeRequestDetails.application.applicationNumber,
      };
    return this.dataSource.transaction(async (entityManager) => {
      await entityManager
        .getRepository(ApplicationOfferingChangeRequest)
        .update(
          {
            id: applicationOfferingChangeRequestId,
          },
          {
            applicationOfferingChangeRequestStatus,
            studentConsent,
            studentActionDate: currentDate,
            modifier: auditUser,
            updatedAt: currentDate,
          },
        );
      if (
        applicationOfferingChangeRequestStatus ===
        ApplicationOfferingChangeRequestStatus.InProgressWithSABC
      ) {
        await this.notificationActionsService.saveApplicationOfferingChangeApprovedByStudent(
          ministryNotification,
          entityManager,
        );
      }
    });
  }

  /**
   * Assess the application offering change request status for the given application offering change request id for the ministry user and create a notification for the same.
   * @param applicationOfferingChangeRequestId application offering change request id for which to update the status.
   * @param applicationOfferingChangeRequestStatus the application offering change request status to be updated.
   * @param assessmentNote note added while updating the application offering change request.
   * @param auditUserId user that should be considered the one that is causing the changes.
   */
  async assessApplicationOfferingChangeRequest(
    applicationOfferingChangeRequestId: number,
    applicationOfferingChangeRequestStatus:
      | ApplicationOfferingChangeRequestStatus.Approved
      | ApplicationOfferingChangeRequestStatus.DeclinedBySABC,
    assessmentNote: string,
    auditUserId: number,
  ): Promise<void> {
    const auditUser = { id: auditUserId } as User;
    const currentDate = new Date();
    const applicationOfferingChangeRequest = await this.getById(
      applicationOfferingChangeRequestId,
    );
    const application = applicationOfferingChangeRequest.application;
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      // Save the note.
      const noteEntity = await this.noteSharedService.createStudentNote(
        application.student.id,
        NoteType.Application,
        assessmentNote,
        auditUserId,
        transactionalEntityManager,
      );
      // Update the application offering change request.
      applicationOfferingChangeRequest.applicationOfferingChangeRequestStatus =
        applicationOfferingChangeRequestStatus;
      applicationOfferingChangeRequest.assessedNote = noteEntity;
      applicationOfferingChangeRequest.modifier = auditUser;
      applicationOfferingChangeRequest.updatedAt = currentDate;
      applicationOfferingChangeRequest.assessedBy = auditUser;
      applicationOfferingChangeRequest.assessedDate = currentDate;
      // Save the application.
      if (
        applicationOfferingChangeRequestStatus ===
        ApplicationOfferingChangeRequestStatus.Approved
      ) {
        // Access the student assessment if it exists.
        const studentAssessment = application.currentAssessment;
        // Create a new assessment if the application offering change request status is approved.
        application.currentAssessment = {
          application,
          triggerType: AssessmentTriggerType.ApplicationOfferingChange,
          offering: applicationOfferingChangeRequest.requestedOffering,
          applicationOfferingChangeRequest,
          creator: auditUser,
          createdAt: currentDate,
          submittedBy: auditUser,
          submittedDate: currentDate,
        } as StudentAssessment;
        // Update the student appeal record for the student assessment if it exists.
        if (studentAssessment.studentAppeal) {
          application.currentAssessment.studentAppeal = {
            id: studentAssessment.studentAppeal.id,
          } as StudentAppeal;
        }
      }
      await transactionalEntityManager
        .getRepository(ApplicationOfferingChangeRequest)
        .save(applicationOfferingChangeRequest);
      // Send the application offering change request completed notification.
      const systemUser = this.systemUsersService.systemUser;
      const user = applicationOfferingChangeRequest.application.student.user;
      await this.notificationActionsService.saveApplicationOfferingChangeRequestCompleteNotification(
        {
          givenNames: user.firstName,
          lastName: user.lastName,
          toAddress: user.email,
          userId: user.id,
        },
        systemUser.id,
        transactionalEntityManager,
      );
    });
  }
}
