import { Controller } from "@nestjs/common";
import { ZeebeWorker } from "../../zeebe/zeebe-worker.decorator";
import {
  ZeebeJob,
  MustReturnJobActionAcknowledgement,
  IOutputVariables,
  ICustomHeaders,
} from "zeebe-node";
import {
  ApplicationExceptionService,
  ApplicationService,
} from "../../services";
import {
  ApplicationExceptionsWorkersInDTO,
  ApplicationExceptionsWorkersOutDTO,
  ApplicationUpdateStatusHeadersDTO,
  ApplicationUpdateStatusWorkersInDTO,
} from "..";
import { APPLICATION_ID } from "../workflow-constants";
import { ApplicationExceptionStatus } from "@sims/sims-db";

@Controller()
export class ApplicationController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly applicationExceptionService: ApplicationExceptionService,
  ) {}

  @ZeebeWorker("update-application-status", {
    fetchVariable: [APPLICATION_ID],
  })
  async updateApplicationStatus(
    job: Readonly<
      ZeebeJob<
        ApplicationUpdateStatusWorkersInDTO,
        ApplicationUpdateStatusHeadersDTO,
        IOutputVariables
      >
    >,
  ): Promise<MustReturnJobActionAcknowledgement> {
    const updateResult = await this.applicationService.updateStatus(
      job.variables.applicationId,
      job.customHeaders.fromStatus,
      job.customHeaders.toStatus,
    );
    if (!updateResult.affected) {
      return job.error(
        "APPLICATION_STATUS_NOT_UPDATED",
        "The application status was not updated either because the application id was not found or the application is not in the expected status.",
      );
    }
    return job.complete();
  }

  @ZeebeWorker("verify-application-exceptions", {
    fetchVariable: [APPLICATION_ID],
  })
  async verifyApplicationExceptions(
    job: Readonly<
      ZeebeJob<
        ApplicationExceptionsWorkersInDTO,
        ICustomHeaders,
        ApplicationExceptionsWorkersOutDTO
      >
    >,
  ): Promise<MustReturnJobActionAcknowledgement> {
    const application = await this.applicationService.getApplicationById(
      job.variables.applicationId,
    );
    if (!application) {
      return job.error("APPLICATION_NOT_FOUND", "Application id not found.");
    }
    if (application.applicationException) {
      // The exceptions were already processed for this application.
      return job.complete({
        applicationExceptionStatus:
          application.applicationException.exceptionStatus,
      });
    }
    // Check for application exceptions present in the application dynamic data.
    const exceptions = this.applicationExceptionService.searchExceptions(
      application.data,
    );
    if (exceptions.length) {
      await this.applicationExceptionService.createException(
        job.variables.applicationId,
        exceptions,
      );
      return job.complete({
        applicationExceptionStatus: ApplicationExceptionStatus.Pending,
      });
    }
    return job.complete({
      applicationExceptionStatus: ApplicationExceptionStatus.Approved,
    });
  }
}
