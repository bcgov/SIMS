import { Controller } from "@nestjs/common";
import { ZeebeWorker } from "../../zeebe";
import { ZeebeJob, MustReturnJobActionAcknowledgement } from "zeebe-node";
import { ApplicationService } from "../../services";
import {
  ProgramInfoRequestJobInDTO,
  ProgramInfoRequestJobHeaderDTO,
  ProgramInfoRequestJobOutDTO,
} from "..";
import { APPLICATION_NOT_FOUND } from "../../constants";
import { APPLICATION_ID } from "@sims/services/workflow/variables/assessment-gateway";

@Controller()
export class ProgramInfoRequestController {
  constructor(private readonly applicationService: ApplicationService) {}

  /**
   * Defines the Program Information Request (PIR) status for the student
   * application returning the its most updated status.
   * @returns most updated status of the PIR.
   */
  @ZeebeWorker("program-info-request", { fetchVariable: [APPLICATION_ID] })
  async updateApplicationStatus(
    job: Readonly<
      ZeebeJob<
        ProgramInfoRequestJobInDTO,
        ProgramInfoRequestJobHeaderDTO,
        ProgramInfoRequestJobOutDTO
      >
    >,
  ): Promise<MustReturnJobActionAcknowledgement> {
    const application = await this.applicationService.getApplicationById(
      job.variables.applicationId,
      { loadDynamicData: false },
    );
    if (!application) {
      return job.error(
        APPLICATION_NOT_FOUND,
        "Application not found while verifying the PIR.",
      );
    }
    if (application.pirStatus) {
      // PIR status was already set, just return it.
      return job.complete({
        programInfoStatus: application.pirStatus,
      });
    }
    const updateResult = await this.applicationService.updateProgramInfoStatus(
      job.variables.applicationId,
      job.customHeaders.programInfoStatus,
    );
    if (updateResult.affected) {
      return job.complete({
        programInfoStatus: job.customHeaders.programInfoStatus,
      });
    }
    return job.fail(
      "PIR was not updated as expected. It was expected that at least one record was updated. Either application was not found or the PIR status was already set.",
    );
  }
}
