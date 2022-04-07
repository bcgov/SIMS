import { Controller, Post } from "@nestjs/common";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ECertFileHandler } from "../../esdc-integration/e-cert-integration/e-cert-file-handler";
import { ESDCFileResponseDTO, ESDCFileResultDTO } from "./models/esdc-model";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { OfferingIntensity } from "../../database/entities";
import { ECertFullTimeResponseService } from "../../esdc-integration/e-cert-integration/e-cert-full-time-integration/e-cert-full-time-response.service";
import { ECertFullTimeIntegrationService } from "../../esdc-integration/e-cert-integration/e-cert-full-time-integration/e-cert-full-time-integration.service";
import { ECertPartTimeIntegrationService } from "../../esdc-integration/e-cert-integration/e-cert-part-time-integration/e-cert-part-time-integration.service";
import {
  ECERT_FULL_TIME_FILE_CODE,
  ECERT_PART_TIME_FILE_CODE,
} from "../../utilities";

const ECERT_FULL_TIME_SENT_FILE_SEQUENCE_GROUP = "ECERT_FT_SENT_FILE";
const ECERT_PART_TIME_SENT_FILE_SEQUENCE_GROUP = "ECERT_PT_SENT_FILE";
@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("system-access/e-cert")
@ApiTags("system-access")
export class ECertIntegrationController extends BaseController {
  constructor(
    private readonly eCertFileHandler: ECertFileHandler,
    private readonly eCertFullTimeResponseService: ECertFullTimeResponseService,
    private readonly eCertFullTimeIntegrationService: ECertFullTimeIntegrationService,
    private readonly eCertPartTimeIntegrationService: ECertPartTimeIntegrationService,
  ) {
    super();
  }

  /**
   * Process Full-Time disbursements available to be sent to ESDC.
   * Consider any record that is scheduled in upcoming days or in the past.
   * @returns result of the file upload with the file generated and the
   * amount of records added to the file.
   */
  @Post("process-full-time")
  async processFullTimeECertFile(): Promise<ESDCFileResultDTO> {
    this.logger.log("Sending Full-Time E-Cert File...");
    const uploadFullTimeResult = await this.eCertFileHandler.generateECert(
      this.eCertFullTimeIntegrationService,
      OfferingIntensity.fullTime,
      ECERT_FULL_TIME_FILE_CODE,
      ECERT_FULL_TIME_SENT_FILE_SEQUENCE_GROUP,
    );
    this.logger.log("E-Cert Full-Time file sent.");
    return {
      generatedFile: uploadFullTimeResult.generatedFile,
      uploadedRecords: uploadFullTimeResult.uploadedRecords,
    };
  }

  /**
   * Process Part-Time disbursements available to be sent to ESDC.
   * Consider any record that is scheduled in upcoming days or in the past.
   * @returns result of the file upload with the file generated and the
   * amount of records added to the file.
   */
  @Post("process-part-time")
  async processPartTimeECertFile(): Promise<ESDCFileResultDTO> {
    this.logger.log("Sending Part-Time E-Cert File...");
    const uploadPartTimeResult = await this.eCertFileHandler.generateECert(
      this.eCertPartTimeIntegrationService,
      OfferingIntensity.partTime,
      ECERT_PART_TIME_FILE_CODE,
      ECERT_PART_TIME_SENT_FILE_SEQUENCE_GROUP,
    );
    this.logger.log("E-Cert Part-Time file sent.");
    return {
      generatedFile: uploadPartTimeResult.generatedFile,
      uploadedRecords: uploadPartTimeResult.uploadedRecords,
    };
  }

  /**
   * Download all files from E-Cert Response folder on SFTP and process them all.
   * @returns Summary with what was processed and the list of all errors, if any.
   */
  @Post("process-responses")
  async processResponses(): Promise<ESDCFileResponseDTO[]> {
    const results = await this.eCertFullTimeResponseService.processResponses();
    return results.map((result) => {
      return {
        processSummary: result.processSummary,
        errorsSummary: result.errorsSummary,
      };
    });
  }

  @InjectLogger()
  logger: LoggerService;
}
