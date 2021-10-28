import { Controller, Post } from "@nestjs/common";
import { MSFAAValidationResultDto } from "./models/msfaa-file-result.dto";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { OfferingIntensity } from "src/database/entities";
import { MSFAAValidationService } from "src/msfaa-integration/msfaa-validation.service";

@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("system-access/msfaa-integration")
export class MSFAAIntegrationController {
  constructor(
    private readonly msfaaValidationService: MSFAAValidationService,
  ) {}

  /**
   * Identifies all the records where the MSFAA number
   * is not validated i.e. has date_requested=null
   * create a fixed file and send file to the sftp server
   * to validate if the MSFAA number
   * @returns Processing result log.
   */
  @Post("process-validation")
  async processMSFAAValidation(): Promise<MSFAAValidationResultDto[]> {
    this.logger.log("Sending Full Time MSFAA file for validation...");
    const uploadFullTimeResult =
      await this.msfaaValidationService.processMSFAAValidation(
        OfferingIntensity.fullTime,
      );
    this.logger.log("MSFAA Full Time file sent.");
    this.logger.log("Sending Part Time MSFAA file for validation...");
    const uploadPartTimeResult =
      await this.msfaaValidationService.processMSFAAValidation(
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
