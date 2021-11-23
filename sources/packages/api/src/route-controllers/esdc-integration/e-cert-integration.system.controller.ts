import { Controller, Post } from "@nestjs/common";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ECertFullTimeRequestService } from "../../esdc-integration/e-cert-full-time-integration/e-cert-full-time-request.service";
import { ESDCFileResultDTO } from "./models/esdc-model";

@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("system-access/e-cert")
export class ECertIntegrationController {
  constructor(
    private readonly ecertFullTimeRequestService: ECertFullTimeRequestService,
  ) {}

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

  @InjectLogger()
  logger: LoggerService;
}
