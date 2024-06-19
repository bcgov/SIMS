import { Controller, Logger } from "@nestjs/common";
import { ZeebeWorker } from "../../zeebe";
// TODO: In the upcoming tasks, either DisbursementScheduleService will be renamed at shared library
// or MSFAA related methods will move to shared library.
import { DisbursementScheduleSharedService } from "@sims/services";
import { DisbursementScheduleService } from "../../services";
import {
  SaveDisbursementSchedulesJobInDTO,
  AssignMSFAAJobInDTO,
} from "./disbursement.dto";
import { CustomNamedError } from "@sims/utilities";
import {
  APPLICATION_INVALID_DATA_TO_CREATE_MSFAA_ERROR,
  ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
  ASSESSMENT_NOT_FOUND,
  DISBURSEMENT_SCHEDULES_ALREADY_CREATED,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
  Workers,
} from "@sims/services/constants";
import {
  ASSESSMENT_ID,
  DISBURSEMENT_SCHEDULES,
} from "@sims/services/workflow/variables/assessment-gateway";
import { MaxJobsToActivate } from "../../types";
import {
  DISBURSEMENT_MSFAA_ALREADY_ASSOCIATED,
  DISBURSEMENT_NOT_FOUND,
} from "../../constants";
import { createUnexpectedJobFail } from "../../utilities";
import {
  ICustomHeaders,
  IOutputVariables,
  MustReturnJobActionAcknowledgement,
  ZeebeJob,
} from "@camunda8/sdk/dist/zeebe/types";

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
    maxJobsToActivate: MaxJobsToActivate.Medium,
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
    const jobLogger = new Logger(job.type);
    try {
      await this.disbursementScheduleSharedService.createDisbursementSchedules(
        job.variables.assessmentId,
        job.variables.disbursementSchedules,
      );
      jobLogger.log("Created disbursement schedule");
      return job.complete();
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case DISBURSEMENT_SCHEDULES_ALREADY_CREATED:
            jobLogger.log(`${error.name} ${error.message}`);
            return job.complete();
          case ASSESSMENT_NOT_FOUND:
          case ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE:
            jobLogger.error(`${error.name} ${error.message}`);
            return job.error(error.name, error.message);
        }
      }
      return createUnexpectedJobFail(error, job, {
        logger: jobLogger,
      });
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
    const jobLogger = new Logger(job.type);
    try {
      await this.disbursementScheduleService.associateMSFAANumber(
        job.variables.assessmentId,
      );
      jobLogger.log("Associated the MSFAA number to the disbursements.");
      return job.complete();
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case DISBURSEMENT_NOT_FOUND:
          case INVALID_OPERATION_IN_THE_CURRENT_STATUS:
          case APPLICATION_INVALID_DATA_TO_CREATE_MSFAA_ERROR:
            jobLogger.error(`${error.name} ${error.message}`);
            return job.error(error.name, error.message);
          case DISBURSEMENT_MSFAA_ALREADY_ASSOCIATED:
            jobLogger.log(`${error.name} ${error.message}`);
            return job.complete();
        }
      }
      return createUnexpectedJobFail(error, job, {
        logger: jobLogger,
      });
    }
  }
}
