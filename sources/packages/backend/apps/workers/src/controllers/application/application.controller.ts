import { Controller, Logger } from "@nestjs/common";
import { ZeebeWorker } from "../../zeebe";
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
  ApplicationExceptionsJobInDTO,
  ApplicationExceptionsJobOutDTO,
  ApplicationUpdateStatusJobHeaderDTO,
  ApplicationUpdateStatusJobInDTO,
} from "..";
import { ApplicationExceptionStatus } from "@sims/sims-db";
import {
  APPLICATION_NOT_FOUND,
  APPLICATION_STATUS_NOT_UPDATED,
} from "../../constants";
import { APPLICATION_ID } from "@sims/services/workflow/variables/assessment-gateway";
import { MaxJobsToActivate } from "../../types";
import { Workers } from "@sims/services/constants";

@Controller()
export class ApplicationController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly applicationExceptionService: ApplicationExceptionService,
  ) {}

  /**
   * Updates the student application status ensuring that the application
   * was in the expected state and also allowing the method to be called
   * multiple times without causing any harm to enure the impotency.
   * @returns reports only that the job was completed without returning any
   * output variables.
   */
  @ZeebeWorker(Workers.UpdateApplicationStatus, {
    fetchVariable: [APPLICATION_ID],
    maxJobsToActivate: MaxJobsToActivate.Maximum,
  })
  async updateApplicationStatus(
    job: Readonly<
      ZeebeJob<
        ApplicationUpdateStatusJobInDTO,
        ApplicationUpdateStatusJobHeaderDTO,
        IOutputVariables
      >
    >,
  ): Promise<MustReturnJobActionAcknowledgement> {
    const jobLogger = new Logger(job.type);
    try {
      const updateResult = await this.applicationService.updateStatus(
        job.variables.applicationId,
        job.customHeaders.fromStatus,
        job.customHeaders.toStatus,
      );
      if (!updateResult.affected) {
        const message =
          "The application status was not updated either because the application id was not found or the application is not in the expected status.";
        jobLogger.error(message);
        return job.error(APPLICATION_STATUS_NOT_UPDATED, message);
      }
      jobLogger.log("Updated the application status.");
      return job.complete();
    } catch (error: unknown) {
      const errorMessage = `Unexpected error while updating the application status. ${error}`;
      jobLogger.error(errorMessage);
      return job.fail(errorMessage);
    }
  }

  /**
   * Searches the student application dynamic data recursively trying to
   * find properties with the value defined as "studentApplicationException"
   * which identifies an application exception to be reviewed by the Ministry.
   * @returns application exceptions status.
   */
  @ZeebeWorker(Workers.VerifyApplicationExceptions, {
    fetchVariable: [APPLICATION_ID],
    maxJobsToActivate: MaxJobsToActivate.Normal,
  })
  async verifyApplicationExceptions(
    job: Readonly<
      ZeebeJob<
        ApplicationExceptionsJobInDTO,
        ICustomHeaders,
        ApplicationExceptionsJobOutDTO
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
      if (application.applicationException) {
        // The exceptions were already processed for this application.
        jobLogger.log("Exceptions were already processed for the application.");
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
        const createdException =
          await this.applicationExceptionService.createException(
            job.variables.applicationId,
            exceptions,
          );
        jobLogger.log("Exception created.");
        return job.complete({
          applicationExceptionStatus: createdException.exceptionStatus,
        });
      }
      jobLogger.log("Verified application exception.");
      return job.complete({
        applicationExceptionStatus: ApplicationExceptionStatus.Approved,
      });
    } catch (error: unknown) {
      const errorMessage = `Unexpected error while verifying the application exceptions. ${error}`;
      jobLogger.error(errorMessage);
      return job.fail(errorMessage);
    }
  }
}
