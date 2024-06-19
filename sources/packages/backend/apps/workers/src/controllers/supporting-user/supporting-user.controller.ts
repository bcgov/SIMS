import { Controller, Logger } from "@nestjs/common";
import { ZeebeWorker } from "../../zeebe";
import { SupportingUserService } from "../../services";
import {
  CheckSupportingUserResponseJobInDTO,
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
  SUPPORTING_USERS_TYPES,
  SUPPORTING_USER_ID,
} from "@sims/services/workflow/variables/supporting-user-information-request";
import { MaxJobsToActivate } from "../../types";
import { Workers } from "@sims/services/constants";
import {
  ICustomHeaders,
  IOutputVariables,
  MustReturnJobActionAcknowledgement,
  ZeebeJob,
} from "@camunda8/sdk/dist/zeebe/types";

@Controller()
export class SupportingUserController {
  constructor(private readonly supportingUserService: SupportingUserService) {}

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
      const supportingUsers =
        await this.supportingUserService.createSupportingUsers(
          job.variables.applicationId,
          job.variables.supportingUsersTypes,
        );
      const createdSupportingUsersIds = supportingUsers.map(
        (supportingUser) => supportingUser.id,
      );
      jobLogger.log("Created supporting users.");
      return job.complete({ createdSupportingUsersIds });
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
      const outputVariables = filterObjectProperties(
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
}
