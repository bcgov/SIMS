import { Controller } from "@nestjs/common";
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
  AssignMSFAAJobInDTO,
} from "..";
import { ApplicationExceptionStatus } from "@sims/sims-db";
import {
  APPLICATION_MSFAA_ALREADY_ASSOCIATED,
  APPLICATION_NOT_FOUND,
  APPLICATION_STATUS_NOT_UPDATED,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
} from "../../constants";
import { CustomNamedError } from "@sims/utilities";
import { APPLICATION_ID } from "@sims/services/workflow/variables/assessment-gateway";

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
  @ZeebeWorker("update-application-status", { fetchVariable: [APPLICATION_ID] })
  async updateApplicationStatus(
    job: Readonly<
      ZeebeJob<
        ApplicationUpdateStatusJobInDTO,
        ApplicationUpdateStatusJobHeaderDTO,
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
        APPLICATION_STATUS_NOT_UPDATED,
        "The application status was not updated either because the application id was not found or the application is not in the expected status.",
      );
    }
    return job.complete();
  }

  /**
   * Associates an MSFAA number to the application checking
   * whatever is needed to create a new MSFAA or use an
   * existing one instead.
   */
  @ZeebeWorker("associate-msfaa", { fetchVariable: [APPLICATION_ID] })
  async associateMSFAA(
    job: Readonly<
      ZeebeJob<AssignMSFAAJobInDTO, ICustomHeaders, IOutputVariables>
    >,
  ): Promise<MustReturnJobActionAcknowledgement> {
    try {
      await this.applicationService.associateMSFAANumber(
        job.variables.applicationId,
      );
      return job.complete();
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case APPLICATION_NOT_FOUND:
          case INVALID_OPERATION_IN_THE_CURRENT_STATUS:
            return job.error(error.name, error.message);
          case APPLICATION_MSFAA_ALREADY_ASSOCIATED:
            return job.complete();
        }
      }
      return job.fail(
        `Unexpected error while associating the MSFAA number to the application. ${error}`,
      );
    }
  }

  /**
   * Searches the student application dynamic data recursively trying to
   * find properties with the value defined as "studentApplicationException"
   * which identifies an application exception to be reviewed by the Ministry.
   * @returns application exceptions status.
   */
  @ZeebeWorker("verify-application-exceptions", {
    fetchVariable: [APPLICATION_ID],
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
    const application = await this.applicationService.getApplicationById(
      job.variables.applicationId,
      { loadDynamicData: true },
    );
    if (!application) {
      return job.error(APPLICATION_NOT_FOUND, "Application id not found.");
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
      const createdException =
        await this.applicationExceptionService.createException(
          job.variables.applicationId,
          exceptions,
        );
      return job.complete({
        applicationExceptionStatus: createdException.exceptionStatus,
      });
    }
    return job.complete({
      applicationExceptionStatus: ApplicationExceptionStatus.Approved,
    });
  }
}
