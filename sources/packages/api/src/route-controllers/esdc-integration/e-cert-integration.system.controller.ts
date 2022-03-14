import { Controller, Post } from "@nestjs/common";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ECertFullTimeRequestService } from "../../esdc-integration/e-cert-full-time-integration/e-cert-full-time-request.service";
import { ECertFullTimeResponseService } from "../../esdc-integration/e-cert-full-time-integration/e-cert-full-time-response.service";
import { ESDCFileResultDTO, ESDCFileResponseDTO } from "./models/esdc-model";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";

@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("system-access/e-cert")
@ApiTags("system-access")
export class ECertIntegrationController extends BaseController {
  constructor(
    private readonly ecertFullTimeRequestService: ECertFullTimeRequestService,
    private readonly eCertFullTimeResponseService: ECertFullTimeResponseService,
  ) {
    super();
  }

  /**
   * Process disbursements available to be sent to ESDC.
   * Considerer any record that is scheduled in upcoming days or in the past.
   * @returns result of the file upload with the file generated and the
   * amount of records added to the file.
   */
  @Post("process")
  async processFullTimeECertFile(): Promise<ESDCFileResultDTO> {
    this.logger.log("Sending full time e-Cert File...");
    const uploadResult = await this.ecertFullTimeRequestService.generateECert();
    this.logger.log("Full time e-Cert file sent.");
    return {
      generatedFile: uploadResult.generatedFile,
      uploadedRecords: uploadResult.uploadedRecords,
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
