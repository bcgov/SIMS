import { OfferingIntensity } from "@sims/sims-db";
import {
  DisbursementScheduleErrorsService,
  ECertFeedbackErrorService,
} from "../../services";
import { SequenceControlService, SystemUsersService } from "@sims/services";
import {
  ECERT_PART_TIME_FEEDBACK_FILE_CODE,
  ECERT_PART_TIME_FILE_CODE,
} from "@sims/services/constants";
import { ECertUploadResult } from "./models/e-cert-integration-model";
import { Injectable } from "@nestjs/common";
import { ConfigService, ESDCIntegrationConfig } from "@sims/utilities/config";
import { ECertGenerationService } from "@sims/integrations/services";
import { ECertFileHandler } from "./e-cert-file-handler";
import { ECertPartTimeIntegrationService } from "./e-cert-part-time-integration/e-cert-part-time.integration.service";
import { ProcessSummary } from "@sims/utilities/logger";

const ECERT_PART_TIME_SENT_FILE_SEQUENCE_GROUP = "ECERT_PT_SENT_FILE";

@Injectable()
export class PartTimeECertFileHandler extends ECertFileHandler {
  esdcConfig: ESDCIntegrationConfig;
  constructor(
    configService: ConfigService,
    sequenceService: SequenceControlService,
    eCertGenerationService: ECertGenerationService,
    disbursementScheduleErrorsService: DisbursementScheduleErrorsService,
    systemUserService: SystemUsersService,
    eCertFeedbackErrorService: ECertFeedbackErrorService,
    private readonly eCertIntegrationService: ECertPartTimeIntegrationService,
  ) {
    super(
      configService,
      sequenceService,
      eCertGenerationService,
      disbursementScheduleErrorsService,
      systemUserService,
      eCertFeedbackErrorService,
    );
  }

  /**
   * Method to call the Part-time disbursements available to be sent to ESDC.
   * @param log cumulative process log.
   * @returns result of the file upload with the file generated and the
   * amount of records added to the file.
   */
  async generateECert(log: ProcessSummary): Promise<ECertUploadResult> {
    return this.eCertGeneration(
      this.eCertIntegrationService,
      OfferingIntensity.partTime,
      ECERT_PART_TIME_FILE_CODE,
      ECERT_PART_TIME_SENT_FILE_SEQUENCE_GROUP,
      log,
    );
  }

  /**
   * Method to call the Part-time feedback file processing and the list of all errors, if any.
   * @param processSummary cumulative process log.
   */
  async processECertResponses(processSummary: ProcessSummary): Promise<void> {
    await this.processResponses(
      processSummary,
      this.eCertIntegrationService,
      ECERT_PART_TIME_FEEDBACK_FILE_CODE,
      OfferingIntensity.partTime,
    );
  }
}
