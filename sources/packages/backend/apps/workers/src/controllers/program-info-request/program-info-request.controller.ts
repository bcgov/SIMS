import { Controller, Logger } from "@nestjs/common";
import { ZeebeWorker } from "../../zeebe";
import { ZeebeJob, MustReturnJobActionAcknowledgement } from "zeebe-node";
import { ApplicationService } from "../../services";
import {
  ProgramInfoRequestJobInDTO,
  ProgramInfoRequestJobHeaderDTO,
  ProgramInfoRequestJobOutDTO,
} from "..";
import { APPLICATION_NOT_FOUND } from "../../constants";
import {
  APPLICATION_ID,
  STUDENT_DATA_SELECTED_PROGRAM,
} from "@sims/services/workflow/variables/assessment-gateway";
import { MaxJobsToActivate } from "../../types";
import { Workers } from "@sims/services/constants";

@Controller()
export class ProgramInfoRequestController {
  constructor(private readonly applicationService: ApplicationService) {}

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
        { loadDynamicData: false },
      );
      if (!application) {
        const message = "Application not found while verifying the PIR.";
        jobLogger.error(message);
        return job.error(APPLICATION_NOT_FOUND, message);
      }
      if (application.pirStatus) {
        // PIR status was already set, just return it.
        return job.complete({
          programInfoStatus: application.pirStatus,
        });
      }
      await this.applicationService.updateProgramInfoStatus(
        job.variables.applicationId,
        job.customHeaders.programInfoStatus,
        job.variables.studentDataSelectedProgram,
      );
      return job.complete({
        programInfoStatus: job.customHeaders.programInfoStatus,
      });
    } catch (error: unknown) {
      const errorMessage = `Unexpected error while setting the PIR status. ${error}`;
      jobLogger.error(errorMessage);
      return job.fail(errorMessage);
    }
  }
}
