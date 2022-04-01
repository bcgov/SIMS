import { Controller, Post } from "@nestjs/common";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ECertFullTimeRequestService } from "../../esdc-integration/e-cert-full-time-integration/e-cert-full-time-request.service";
import { ECertPartTimeRequestService } from "../../esdc-integration/e-cert-part-time-integration/e-cert-part-time-request.service";
import { ECertFullTimeResponseService } from "../../esdc-integration/e-cert-full-time-integration/e-cert-full-time-response.service";
import { ESDCFileResponseDTO, ESDCFileResultDTO } from "./models/esdc-model";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { OfferingIntensity } from "../../database/entities";

@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("system-access/e-cert")
@ApiTags("system-access")
export class ECertIntegrationController extends BaseController {
  constructor(
    private readonly eCertFullTimeRequestService: ECertFullTimeRequestService,
    private readonly eCertFullTimeResponseService: ECertFullTimeResponseService,
    private readonly eCertPartTimeRequestService: ECertPartTimeRequestService,
  ) {
    super();
  }

  /**
   * Process disbursements available to be sent to ESDC.
   * Consider any record that is scheduled in upcoming days or in the past.
   * @returns result of the file upload with the file generated and the
   * amount of records added to the file.
   */
  @Post("process-full-time")
  async processFullTimeECertFile(): Promise<ESDCFileResultDTO> {
    this.logger.log("Sending Full-Time E-Cert File...");
    const uploadFullTimeResult =
      await this.eCertFullTimeRequestService.generateECert();
    this.logger.log("E-Cert Full-Time file sent.");
    return {
      generatedFile: uploadFullTimeResult.generatedFile,
      uploadedRecords: uploadFullTimeResult.uploadedRecords,
    };
  }

  /**
   * Process disbursements available to be sent to ESDC.
   * Consider any record that is scheduled in upcoming days or in the past.
   * @returns result of the file upload with the file generated and the
   * amount of records added to the file.
   */
  @Post("process-part-time")
  async processPartTimeECertFile(): Promise<ESDCFileResultDTO> {
    this.logger.log("Sending Part-Time E-Cert File...");
    const uploadPartTimeResult =
      await this.eCertPartTimeRequestService.generateECert();
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
