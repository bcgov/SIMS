import { Controller, Logger } from "@nestjs/common";
import { ZeebeWorker } from "../../zeebe";
import { ApplicationService, SupportingUserService } from "../../services";
import {
  CreateIdentifiableSupportingUsersJobInDTO,
  CreateIdentifiableSupportingUsersJobOutDTO,
} from "./identifiable-supporting-user.dto";
import { APPLICATION_ID } from "@sims/services/workflow/variables/assessment-gateway";
import { MaxJobsToActivate } from "../../types";
import {
  APPLICATION_NOT_FOUND,
  SUPPORTING_USER_FULL_NAME_NOT_RESOLVED,
  Workers,
} from "@sims/services/constants";
import {
  ICustomHeaders,
  MustReturnJobActionAcknowledgement,
  ZeebeJob,
} from "@camunda8/sdk/dist/zeebe/types";
import { DataSource, EntityManager } from "typeorm";
import { createUnexpectedJobFail } from "apps/workers/src/utilities";
import * as JSONPath from "jsonpath";

@Controller()
export class IdentifiableSupportingUserController {
  constructor(
    private readonly dataSource: DataSource,
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
    const jobLogger = new Logger(job.type);
    try {
      const application = await this.applicationService.getApplicationById(
        job.variables.applicationId,
        { loadDynamicData: true },
      );
      if (!application) {
        const message = "Application id not found.";
        jobLogger.error(message);
        return job.error(APPLICATION_NOT_FOUND, message);
      }
      const [fullName] = JSONPath.query(
        application.data,
        job.variables.fullNamePropertyFilter,
      );
      if (!fullName) {
        const message = `Not able to extract the full name from the application dynamic data using filter '${job.variables.fullNamePropertyFilter}'.`;
        jobLogger.error(message);
        return job.error(SUPPORTING_USER_FULL_NAME_NOT_RESOLVED, message);
      }
      return this.dataSource.transaction(
        async (entityManager: EntityManager) => {
          const createdSupportingUserId =
            await this.supportingUserService.createIdentifiableSupportingUser(
              {
                applicationId: job.variables.applicationId,
                supportingUserType: job.variables.supportingUserType,
                fullName: job.variables.fullNamePropertyFilter,
                isAbleToReport: job.variables.isAbleToReport,
              },
              entityManager,
            );
          return job.complete({
            createdSupportingUserId: +createdSupportingUserId,
          });
        },
      );
    } catch (error: unknown) {
      return createUnexpectedJobFail(error, job, {
        logger: jobLogger,
      });
    }
  }
}
