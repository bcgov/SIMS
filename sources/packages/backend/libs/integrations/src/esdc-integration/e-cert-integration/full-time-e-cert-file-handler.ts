import { OfferingIntensity } from "@sims/sims-db";
import {
  DisbursementScheduleErrorsService,
  DisbursementScheduleService,
} from "../../services";
import { SequenceControlService, SystemUsersService } from "@sims/services";
import {
  ECERT_FULL_TIME_FILE_CODE,
  ECERT_FULL_TIME_FEEDBACK_FILE_CODE,
} from "@sims/services/constants";
import {
  ECertUploadResult,
  ESDCFileResponse,
} from "./models/e-cert-integration-model";
import { Injectable } from "@nestjs/common";
import { ConfigService, ESDCIntegrationConfig } from "@sims/utilities/config";
import { ECertGenerationService } from "@sims/integrations/services";
import { ECertFileHandler } from "./e-cert-file-handler";
import { ECertFullTimeIntegrationService } from "./e-cert-full-time-integration/e-cert-full-time.integration.service";

const ECERT_FULL_TIME_SENT_FILE_SEQUENCE_GROUP = "ECERT_FT_SENT_FILE";

@Injectable()
export class FullTimeECertFileHandler extends ECertFileHandler {
  esdcConfig: ESDCIntegrationConfig;
  constructor(
    configService: ConfigService,
    sequenceService: SequenceControlService,
    disbursementScheduleService: DisbursementScheduleService,
    eCertGenerationService: ECertGenerationService,
    disbursementScheduleErrorsService: DisbursementScheduleErrorsService,
    systemUserService: SystemUsersService,
    private readonly eCertIntegrationService: ECertFullTimeIntegrationService,
  ) {
    super(
      configService,
      sequenceService,
      disbursementScheduleService,
      eCertGenerationService,
      disbursementScheduleErrorsService,
      systemUserService,
    );
  }

  /**
   * Method to call the Full-time disbursements available to be sent to ESDC.
   * @returns result of the file upload with the file generated and the
   * amount of records added to the file.
   */
  async generateECert(): Promise<ECertUploadResult> {
    return this.eCertGeneration(
      this.eCertIntegrationService,
      OfferingIntensity.fullTime,
      ECERT_FULL_TIME_FILE_CODE,
      ECERT_FULL_TIME_SENT_FILE_SEQUENCE_GROUP,
    );
  }

  /**
   * Method to call the Full-time feedback file processing and the list of all errors, if any.
   * @returns result of the file upload with the file generated and the
   * amount of records added to the file.
   */
  async processECertResponses(): Promise<ESDCFileResponse[]> {
    return this.processResponses(
      this.eCertIntegrationService,
      ECERT_FULL_TIME_FEEDBACK_FILE_CODE,
    );
  }
}
