import { Controller } from "@nestjs/common";
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
  CheckSupportingUserResponseJobOutDTO,
  CreateSupportingUsersJobInDTO,
  CreateSupportingUsersJobOutDTO,
} from "..";
import { APPLICATION_ID } from "../workflow-constants";
import { SUPPORTING_USER_NOT_FOUND } from "../error-code-constants";

@Controller()
export class SupportingUserController {
  constructor(private readonly supportingUserService: SupportingUserService) {}

  @ZeebeWorker("create-supporting-users", {
    fetchVariable: [APPLICATION_ID, "supportingUsersTypes"],
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
  }

  @ZeebeWorker("check-supporting-user-response", {
    fetchVariable: [APPLICATION_ID, "supportingUserId"],
  })
  async checkSupportingUserResponse(
    job: Readonly<
      ZeebeJob<
        CheckSupportingUserResponseJobInDTO,
        ICustomHeaders,
        CheckSupportingUserResponseJobOutDTO
      >
    >,
  ): Promise<MustReturnJobActionAcknowledgement> {
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
    return job.complete({
      hasSupportingUserData: !!supportingUser.supportingData,
    });
  }
}
