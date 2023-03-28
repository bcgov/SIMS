import { Controller } from "@nestjs/common";
import { ZeebeWorker } from "../../zeebe";
import {
  ZeebeJob,
  ICustomHeaders,
  MustReturnJobActionAcknowledgement,
  IOutputVariables,
} from "zeebe-node";
import { DisbursementScheduleService as DisbursementScheduleSharedService } from "@sims/services";
import { DisbursementScheduleService } from "../../services";
import { SaveDisbursementSchedulesJobInDTO } from "./disbursement.dto";
import { CustomNamedError } from "@sims/utilities";
import {
  ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
  ASSESSMENT_NOT_FOUND,
  DISBURSEMENT_SCHEDULES_ALREADY_CREATED,
  Workers,
} from "@sims/services/constants";
import {
  ASSESSMENT_ID,
  DISBURSEMENT_SCHEDULES,
} from "@sims/services/workflow/variables/assessment-gateway";
import { MaxJobsToActivate } from "../../types";
import { AssignMSFAAJobInDTO } from "../application/application.dto";
import {
  APPLICATION_MSFAA_ALREADY_ASSOCIATED,
  DISBURSEMENT_NOT_FOUND,
} from "../../constants";

@Controller()
export class DisbursementController {
  constructor(
    private readonly disbursementScheduleSharedService: DisbursementScheduleSharedService,
    private readonly disbursementScheduleService: DisbursementScheduleService,
  ) {}

  /**
   * Saves the disbursements schedules (1 or 2) and its values for grants and loans.
   */
  @ZeebeWorker(Workers.SaveDisbursementSchedules, {
    fetchVariable: [ASSESSMENT_ID, DISBURSEMENT_SCHEDULES],
    maxJobsToActivate: MaxJobsToActivate.Normal,
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
      await this.disbursementScheduleSharedService.createDisbursementSchedules(
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

  /**
   * Associates an MSFAA number to the disbursement(s) checking
   * whatever is needed to create a new MSFAA or use an
   * existing one instead.
   */
  @ZeebeWorker(Workers.AssociateMSFAA, {
    fetchVariable: [ASSESSMENT_ID],
    maxJobsToActivate: MaxJobsToActivate.Low,
  })
  async associateMSFAA(
    job: Readonly<
      ZeebeJob<AssignMSFAAJobInDTO, ICustomHeaders, IOutputVariables>
    >,
  ): Promise<MustReturnJobActionAcknowledgement> {
    try {
      await this.disbursementScheduleService.associateMSFAANumber(
        job.variables.assessmentId,
      );
      return job.complete();
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case DISBURSEMENT_NOT_FOUND:
            return job.error(error.name, error.message);
          case APPLICATION_MSFAA_ALREADY_ASSOCIATED:
            return job.complete();
        }
      }
      return job.fail(
        `Unexpected error while associating the MSFAA number to the disbursements. ${error}`,
      );
    }
  }
}
