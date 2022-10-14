import { Controller } from "@nestjs/common";
import { ZeebeWorker } from "../../zeebe";
import {
  ZeebeJob,
  ICustomHeaders,
  MustReturnJobActionAcknowledgement,
  IOutputVariables,
} from "zeebe-node";
import { DisbursementScheduleService } from "../../services";
import { ASSESSMENT_ID } from "@sims/services";
import { SaveDisbursementSchedulesJobInDTO } from "./disbursement.dto";
import { CustomNamedError } from "@sims/utilities";
import {
  ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
  ASSESSMENT_NOT_FOUND,
  DISBURSEMENT_SCHEDULES_ALREADY_CREATED,
} from "../../constants";

@Controller()
export class DisbursementController {
  constructor(
    private readonly disbursementScheduleService: DisbursementScheduleService,
  ) {}

  @ZeebeWorker("save-disbursement-schedules", {
    fetchVariable: [ASSESSMENT_ID, "disbursementSchedules"],
  })
  async saveDisbursementSchedules(
    job: Readonly<
      ZeebeJob<
        SaveDisbursementSchedulesJobInDTO,
        ICustomHeaders,
        IOutputVariables
      >
    >,
  ): Promise<MustReturnJobActionAcknowledgement> {
    try {
      await this.disbursementScheduleService.createDisbursementSchedules(
        job.variables.assessmentId,
        job.variables.disbursementSchedules,
      );
      return job.complete();
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case DISBURSEMENT_SCHEDULES_ALREADY_CREATED:
            return job.complete();
          case ASSESSMENT_NOT_FOUND:
          case ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE:
            return job.error(error.name, error.message);
        }
      }
      return job.fail(
        `Unexpected error while creating disbursement schedules. ${error}`,
      );
    }
  }
}
