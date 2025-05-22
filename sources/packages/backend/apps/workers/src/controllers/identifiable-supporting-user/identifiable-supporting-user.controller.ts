import { Controller } from "@nestjs/common";
import { ZeebeWorker } from "../../zeebe";
import { ApplicationService, SupportingUserService } from "../../services";
import {
  CreateIdentifiableSupportingUsersJobInDTO,
  CreateIdentifiableSupportingUsersJobOutDTO,
} from "./identifiable-supporting-user.dto";
import { APPLICATION_ID } from "@sims/services/workflow/variables/assessment-gateway";
import { MaxJobsToActivate } from "../../types";
import { Workers } from "@sims/services/constants";
import {
  ICustomHeaders,
  MustReturnJobActionAcknowledgement,
  ZeebeJob,
} from "@camunda8/sdk/dist/zeebe/types";
import * as JSONPath from "jsonpath";

@Controller()
export class IdentifiableSupportingUserController {
  constructor(
    private readonly supportingUserService: SupportingUserService,
    private readonly applicationService: ApplicationService,
  ) {}

  @ZeebeWorker(Workers.CreateIdentifiableSupportingUsers, {
    fetchVariable: [
      APPLICATION_ID,
      "supportingUserType",
      "fullNamePropertyFilter",
      "isAbleToReport",
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
    const application = await this.applicationService.getApplicationById(
      job.variables.applicationId,
      { loadDynamicData: true },
    );
    const [fullName] = JSONPath.query(
      application.data,
      job.variables.fullNamePropertyFilter,
    );
    console.log(fullName);
    return job.error("Not implemented yet!");
  }
}
