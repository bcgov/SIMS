import { Controller, Logger } from "@nestjs/common";
import { ZeebeWorker } from "../../zeebe";
import {
  ZeebeJob,
  MustReturnJobActionAcknowledgement,
  IOutputVariables,
  ICustomHeaders,
} from "zeebe-node";
import { SupportingUserService } from "../../services";
import {
  CheckSupportingUserResponseJobInDTO,
  CreateSupportingUsersJobInDTO,
  CreateSupportingUsersJobOutDTO,
} from "..";
import { filterObjectProperties } from "../../utilities";
import { SUPPORTING_USER_NOT_FOUND } from "../../constants";
import { APPLICATION_ID } from "@sims/services/workflow/variables/assessment-gateway";
import {
  SUPPORTING_USERS_TYPES,
  SUPPORTING_USER_ID,
} from "@sims/services/workflow/variables/supporting-user-information-request";
import { MaxJobsToActivate } from "../../types";
import { Workers } from "@sims/services/constants";

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
        IOutputVariables,
        CreateSupportingUsersJobOutDTO
      >
    >,
  ): Promise<MustReturnJobActionAcknowledgement> {
    try {
      const hasSupportingUsers =
        await this.supportingUserService.hasSupportingUsers(
          job.variables.applicationId,
        );
      if (hasSupportingUsers) {
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
      return job.complete({ createdSupportingUsersIds });
    } catch (error: unknown) {
      const jobLogger = new Logger(job.type);
      const errorMessage = `Unexpected error while creating supporting users. ${error}`;
      jobLogger.error(errorMessage);
      return job.fail(errorMessage);
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
    try {
      const supportingUser =
        await this.supportingUserService.getSupportingUserById(
          job.variables.supportingUserId,
        );
      if (!supportingUser) {
        job.error(
          SUPPORTING_USER_NOT_FOUND,
          "Supporting user not found while checking for supporting user response.",
        );
      }
      const outputVariables = filterObjectProperties(
        supportingUser.supportingData,
        job.customHeaders,
      );
      return job.complete(outputVariables);
    } catch (error: unknown) {
      const jobLogger = new Logger(job.type);
      const errorMessage = `Unexpected error while loading supporting user data. ${error}`;
      jobLogger.error(errorMessage);
      return job.fail(errorMessage);
    }
  }
}
