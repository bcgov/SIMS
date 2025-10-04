import { Controller, Logger } from "@nestjs/common";
import { ZeebeWorker } from "../../zeebe";
import { ApplicationService, SupportingUserService } from "../../services";
import {
  CheckSupportingUserResponseJobInDTO,
  CreateIdentifiableSupportingUsersJobInDTO,
  CreateIdentifiableSupportingUsersJobOutDTO,
  CreateSupportingUsersJobInDTO,
  CreateSupportingUsersJobOutDTO,
} from "..";
import {
  createUnexpectedJobFail,
  filterObjectProperties,
} from "../../utilities";
import { SUPPORTING_USER_NOT_FOUND } from "../../constants";
import { APPLICATION_ID } from "@sims/services/workflow/variables/assessment-gateway";
import {
  CREATED_SUPPORTING_USER_ID,
  FULL_NAME_PROPERTY_FILTER,
  IS_ABLE_TO_REPORT,
  SUPPORTING_USERS_TYPES,
  SUPPORTING_USER_ID,
  SUPPORTING_USER_TYPE,
} from "@sims/services/workflow/variables/supporting-user-information-request";
import { MaxJobsToActivate } from "../../types";
import {
  APPLICATION_NOT_FOUND,
  SUPPORTING_USER_FULL_NAME_NOT_RESOLVED,
  Workers,
} from "@sims/services/constants";
import {
  ICustomHeaders,
  IOutputVariables,
  MustReturnJobActionAcknowledgement,
  ZeebeJob,
} from "@camunda8/sdk/dist/zeebe/types";
import {
  NotificationActionsService,
  NotificationSupportingUserType,
  ParentInformationRequiredFromParentNotification,
  ParentInformationRequiredFromStudentNotification,
} from "@sims/services";
import { SupportingUserType } from "@sims/sims-db";
import { DataSource, EntityManager } from "typeorm";
import jsonata from "jsonata";

@Controller()
export class SupportingUserController {
  constructor(
    private readonly supportingUserService: SupportingUserService,
    private readonly applicationService: ApplicationService,
    private readonly notificationActionsService: NotificationActionsService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create supporting users for an application.
   * @deprecated for parents prior to 2025/26 program year but
   * still used for partners across all program years.
   * Parents will be created using the method {@link createIdentifiableSupportingUsers}.
   * @param job input variables for creating supporting users.
   * @returns acknowledgement of the job completion or failure.
   */
  @ZeebeWorker(Workers.CreateSupportingUsers, {
    fetchVariable: [APPLICATION_ID, SUPPORTING_USERS_TYPES],
    maxJobsToActivate: MaxJobsToActivate.Normal,
  })
  async createSupportingUsers(
    job: Readonly<
      ZeebeJob<
        CreateSupportingUsersJobInDTO,
        ICustomHeaders,
        CreateSupportingUsersJobOutDTO
      >
    >,
  ): Promise<MustReturnJobActionAcknowledgement> {
    const jobLogger = new Logger(job.type);
    try {
      const hasSupportingUsers =
        await this.supportingUserService.hasSupportingUsers(
          job.variables.applicationId,
        );
      if (hasSupportingUsers) {
        jobLogger.log("Supporting users already exists.");
        return job.complete();
      }
      const application = await this.applicationService.getApplicationById(
        job.variables.applicationId,
      );
      return this.dataSource.transaction(
        async (transactionalEntityManager: EntityManager) => {
          const supportingUsers =
            await this.supportingUserService.createSupportingUsers(
              job.variables.applicationId,
              job.variables.supportingUsersTypes,
              transactionalEntityManager,
            );
          const createdSupportingUsersIds = supportingUsers.map(
            (supportingUser) => supportingUser.id,
          );
          jobLogger.log("Created supporting users.");
          const supportingUserType = this.getNotificationSupportingUserType(
            job.variables.supportingUsersTypes,
          );
          await this.notificationActionsService.saveSupportingUserInformationNotification(
            {
              givenNames: application.student.user.firstName,
              lastName: application.student.user.lastName,
              toAddress: application.student.user.email,
              userId: application.student.user.id,
              supportingUserType: supportingUserType,
            },
            transactionalEntityManager,
          );
          jobLogger.log(
            "Supporting user notification has been created for the student.",
          );
          return job.complete({ createdSupportingUsersIds });
        },
      );
    } catch (error: unknown) {
      return createUnexpectedJobFail(error, job, {
        logger: jobLogger,
      });
    }
  }

  /**
   * Create identifiable supporting users for an application, where the data can be provided
   * by the student or by the supporting user themselves.
   * @param job input variables for creating identifiable supporting users.
   * @returns acknowledgement of the job completion or failure.
   */
  @ZeebeWorker(Workers.CreateIdentifiableSupportingUsers, {
    fetchVariable: [
      APPLICATION_ID,
      SUPPORTING_USER_TYPE,
      FULL_NAME_PROPERTY_FILTER,
      IS_ABLE_TO_REPORT,
    ],
    maxJobsToActivate: MaxJobsToActivate.Normal,
  })
  async createIdentifiableSupportingUsers(
    job: Readonly<
      ZeebeJob<
        CreateIdentifiableSupportingUsersJobInDTO,
        ICustomHeaders,
        CreateIdentifiableSupportingUsersJobOutDTO
      >
    >,
  ): Promise<MustReturnJobActionAcknowledgement> {
    const jobLogger = new Logger(job.type);
    try {
      const application = await this.applicationService.getApplicationById(
        job.variables.applicationId,
        { loadDynamicData: true },
      );
      if (!application) {
        const message = "Application ID not found.";
        jobLogger.error(message);
        return job.error(APPLICATION_NOT_FOUND, message);
      }
      // Resolve the full name from the application dynamic data using the optional provided filter.
      let fullName: string;
      if (job.variables.fullNamePropertyFilter) {
        const jsonataExpression = jsonata(job.variables.fullNamePropertyFilter);
        fullName = await jsonataExpression.evaluate(application.data);
        if (!fullName) {
          // If the full name property filter is provided, full name is mandatory to be present.
          const message = `Not able to extract the full name from the application dynamic data using filter '${job.variables.fullNamePropertyFilter}'.`;
          jobLogger.error(message);
          return job.error(SUPPORTING_USER_FULL_NAME_NOT_RESOLVED, message);
        }
      }
      const isAbleToReport = job.variables.isAbleToReport;
      return this.dataSource.transaction(
        async (entityManager: EntityManager) => {
          const createdSupportingUserId =
            await this.supportingUserService.createIdentifiableSupportingUser(
              {
                applicationId: job.variables.applicationId,
                supportingUserType: job.variables.supportingUserType,
                fullName,
                isAbleToReport,
              },
              entityManager,
            );
          const notificationPayload:
            | ParentInformationRequiredFromParentNotification
            | ParentInformationRequiredFromStudentNotification = {
            givenNames: application.student.user.firstName,
            lastName: application.student.user.lastName,
            toAddress: application.student.user.email,
            userId: application.student.user.id,
            supportingUserType:
              job.variables.supportingUserType === SupportingUserType.Parent
                ? "parent"
                : "partner",
            parentFullName: fullName,
            applicationNumber: application.applicationNumber,
          };
          if (isAbleToReport) {
            await this.notificationActionsService.saveParentInformationRequiredFromParentNotification(
              notificationPayload,
              entityManager,
            );
          } else {
            await this.notificationActionsService.saveParentInformationRequiredFromStudentNotification(
              notificationPayload,
              entityManager,
            );
          }
          return job.complete({
            [CREATED_SUPPORTING_USER_ID]: createdSupportingUserId,
          });
        },
      );
    } catch (error: unknown) {
      return createUnexpectedJobFail(error, job, {
        logger: jobLogger,
      });
    }
  }

  @ZeebeWorker(Workers.LoadSupportingUserData, {
    fetchVariable: [APPLICATION_ID, SUPPORTING_USER_ID],
    maxJobsToActivate: MaxJobsToActivate.High,
  })
  async checkSupportingUserResponse(
    job: Readonly<
      ZeebeJob<
        CheckSupportingUserResponseJobInDTO,
        ICustomHeaders,
        IOutputVariables
      >
    >,
  ): Promise<MustReturnJobActionAcknowledgement> {
    const jobLogger = new Logger(job.type);
    try {
      const supportingUser =
        await this.supportingUserService.getSupportingUserById(
          job.variables.supportingUserId,
        );
      if (!supportingUser) {
        const message =
          "Supporting user not found while checking for supporting user response.";
        jobLogger.error(message);
        job.error(SUPPORTING_USER_NOT_FOUND, message);
      }
      const outputVariables = await filterObjectProperties(
        supportingUser.supportingData,
        job.customHeaders,
      );
      jobLogger.log("Supporting user data loaded.");
      return job.complete(outputVariables);
    } catch (error: unknown) {
      return createUnexpectedJobFail(error, job, {
        logger: jobLogger,
      });
    }
  }

  /**
   * Get notification supporting user type from an array of supporting user type.
   * @param supportingUsers an array of supporting user type.
   * @returns notification supporting user type.
   */
  private getNotificationSupportingUserType(
    supportingUsers: SupportingUserType[],
  ): NotificationSupportingUserType {
    const [supportingUser1, supportingUser2] = supportingUsers;
    // If the supporting user is partner, only one supporting user can be present.
    if (supportingUser1 === SupportingUserType.Partner) {
      return "partner";
    }
    return supportingUser2 ? "parents" : "parent";
  }
}
