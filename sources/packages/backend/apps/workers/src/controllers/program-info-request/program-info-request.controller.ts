import { Controller, Logger } from "@nestjs/common";
import { ZeebeWorker } from "../../zeebe";
import { ApplicationService, ProgramInfoRequestService } from "../../services";
import {
  ProgramInfoRequestJobInDTO,
  ProgramInfoRequestJobHeaderDTO,
  ProgramInfoRequestJobOutDTO,
} from "..";
import { APPLICATION_NOT_FOUND, PIR_STATUS_ALREADY_SET } from "../../constants";
import {
  APPLICATION_ID,
  STUDENT_DATA_SELECTED_PROGRAM,
} from "@sims/services/workflow/variables/assessment-gateway";
import { MaxJobsToActivate } from "../../types";
import { Workers } from "@sims/services/constants";
import { createUnexpectedJobFail } from "../../utilities";
import {
  MustReturnJobActionAcknowledgement,
  ZeebeJob,
} from "@camunda8/sdk/dist/zeebe/types";
import { Application, ProgramInfoStatus } from "@sims/sims-db";
import { CustomNamedError } from "@sims/utilities";

@Controller()
export class ProgramInfoRequestController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly programInfoRequestService: ProgramInfoRequestService,
  ) {}

  /**
   * Defines the Program Information Request (PIR) status for the student
   * application returning the its most updated status.
   * @returns most updated status of the PIR.
   */
  @ZeebeWorker(Workers.ProgramInfoRequest, {
    fetchVariable: [APPLICATION_ID, STUDENT_DATA_SELECTED_PROGRAM],
    maxJobsToActivate: MaxJobsToActivate.High,
  })
  async updateApplicationStatus(
    job: Readonly<
      ZeebeJob<
        ProgramInfoRequestJobInDTO,
        ProgramInfoRequestJobHeaderDTO,
        ProgramInfoRequestJobOutDTO
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
        const message = "Application not found while verifying the PIR.";
        jobLogger.error(message);
        return job.error(APPLICATION_NOT_FOUND, message);
      }
      if (application.pirStatus) {
        // PIR status was already set, just return it.
        jobLogger.log("PIR status was already set.");
        return job.complete({
          programInfoStatus: application.pirStatus,
        });
      }
      // Check for previously approved PIR to reuse the information.
      const applicationDataHash = this.applicationService.getProgramDataHash(
        application.data,
      );
      if (job.customHeaders.programInfoStatus === ProgramInfoStatus.required) {
        let previouslyApprovedPIR: Application | null = null;
        if (applicationDataHash) {
          previouslyApprovedPIR =
            await this.programInfoRequestService.getPreviouslyApprovedPIROfferingId(
              applicationDataHash,
              application.parentApplication.id,
            );
          if (previouslyApprovedPIR) {
            jobLogger.log(
              `Found previously approved PIR approved for application ID ${previouslyApprovedPIR.id} for application ID ${application.id}. Reusing the PIR information.`,
            );
            await this.programInfoRequestService.updatePreviouslyApprovedProgramInfoStatus(
              application.student.id,
              job.variables.applicationId,
              previouslyApprovedPIR.id,
              previouslyApprovedPIR.pirProgram.id,
              previouslyApprovedPIR.currentAssessment.offering.id,
              applicationDataHash,
            );
            return job.complete({
              programInfoStatus: ProgramInfoStatus.completed,
            });
          }
        }
      }
      // PIR status not required or no previously approved PIR found.
      await this.programInfoRequestService.updateProgramInfoStatus(
        job.variables.applicationId,
        job.customHeaders.programInfoStatus,
        applicationDataHash,
        job.variables.studentDataSelectedProgram,
      );
      jobLogger.log(
        `PIR status updated for application ID ${job.variables.applicationId} updated to ${job.customHeaders.programInfoStatus}.`,
      );
      return job.complete({
        programInfoStatus: job.customHeaders.programInfoStatus,
      });
    } catch (error: unknown) {
      if (
        error instanceof CustomNamedError &&
        error.name === PIR_STATUS_ALREADY_SET
      ) {
        jobLogger.log(
          `PIR status was already set for application ID ${job.variables.applicationId}.`,
        );
        // PIR status was already set, just return its most updated status.
        const application = await this.applicationService.getApplicationById(
          job.variables.applicationId,
          { loadDynamicData: false },
        );
        return job.complete({
          programInfoStatus: application.pirStatus,
        });
      }
      return createUnexpectedJobFail(error, job, {
        logger: jobLogger,
      });
    }
  }
}
