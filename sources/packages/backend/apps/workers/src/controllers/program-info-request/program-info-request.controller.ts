import { Controller } from "@nestjs/common";
import { ZeebeWorker } from "../../zeebe";
import { ZeebeJob, MustReturnJobActionAcknowledgement } from "zeebe-node";
import { ApplicationService } from "../../services";
import {
  ProgramInfoRequestWorkersInDTO,
  ProgramInfoRequestHeadersDTO,
  ProgramInfoRequestWorkersOutDTO,
} from "..";
import { APPLICATION_ID } from "../workflow-constants";
import { APPLICATION_NOT_FOUND } from "../error-code-constants";

@Controller()
export class ProgramInfoRequestController {
  constructor(private readonly applicationService: ApplicationService) {}

  @ZeebeWorker("program-info-request", { fetchVariable: [APPLICATION_ID] })
  async updateApplicationStatus(
    job: Readonly<
      ZeebeJob<
        ProgramInfoRequestWorkersInDTO,
        ProgramInfoRequestHeadersDTO,
        ProgramInfoRequestWorkersOutDTO
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
        "Application not found to complete the PIR.",
      );
    }
    if (application.pirStatus) {
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
    return job.complete({
      programInfoStatus: application.pirStatus,
    });
  }
}
