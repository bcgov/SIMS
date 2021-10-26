import { Controller, Post } from "@nestjs/common";
import { MSFAAFileResultDto } from "./models/msfaa-file-result.dto";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { MSFAAValidationService } from "../../services/msfaa-validation/msfaa-validation.service";

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
  @Post("process-msfaa-validation")
  async processMSFAAValidation(): Promise<MSFAAFileResultDto> {
    this.logger.log("Sending MSFAA file for validation...");
    const uploadResult =
      await this.msfaaValidationService.processMSFAAValidation();
    this.logger.log("MSFAA file sent.");
    return {
      generatedFile: uploadResult.generatedFile,
      uploadedRecords: uploadResult.uploadedRecords,
    };
  }

  @InjectLogger()
  logger: LoggerService;
}
