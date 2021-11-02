import { Controller, Post } from "@nestjs/common";
import { MSFAARequestResultDto } from "./models/msfaa-file-result.dto";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { OfferingIntensity } from "../../database/entities";
import { MSFAARequestService } from "../../msfaa-integration/msfaa-request.service";

@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("system-access/msfaa-integration")
export class MSFAAIntegrationController {
  constructor(private readonly msfaaRequestService: MSFAARequestService) {}

  /**
   * Identifies all the records where the MSFAA number
   * is not requested i.e. has date_requested=null
   * create a fixed file and send file to the sftp server
   * to request the MSFAA number
   * @returns Processing result log.
   */
  @Post("process-request")
  async processMSFAARequest(): Promise<MSFAARequestResultDto[]> {
    this.logger.log("Sending Full Time MSFAA file for request...");
    const uploadFullTimeResult =
      await this.msfaaRequestService.processMSFAARequest(
        OfferingIntensity.fullTime,
      );
    this.logger.log("MSFAA Full Time file sent.");
    this.logger.log("Sending Part Time MSFAA file for request...");
    const uploadPartTimeResult =
      await this.msfaaRequestService.processMSFAARequest(
        OfferingIntensity.partTime,
      );
    this.logger.log("MSFAA Part Time file sent.");
    return [
      {
        offeringIntensity: OfferingIntensity.fullTime,
        generatedFile: uploadFullTimeResult.generatedFile,
        uploadedRecords: uploadFullTimeResult.uploadedRecords,
      },
      {
        offeringIntensity: OfferingIntensity.partTime,
        generatedFile: uploadPartTimeResult.generatedFile,
        uploadedRecords: uploadPartTimeResult.uploadedRecords,
      },
    ];
  }

  @InjectLogger()
  logger: LoggerService;
}
