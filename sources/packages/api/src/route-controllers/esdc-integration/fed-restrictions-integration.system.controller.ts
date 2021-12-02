import { Controller, Post } from "@nestjs/common";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { FedRestrictionProcessingService } from "../../esdc-integration/fed-restriction-integration/fed-restriction-processing.service";
import { ProcessSFTPResponseDTO } from "./models/esdc-model";

@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("system-access/fed-restrictions")
export class FedRestrictionsIntegrationController {
  constructor(
    private readonly processingService: FedRestrictionProcessingService,
  ) {}

  @Post("process")
  async processFedRestrictionsImport(): Promise<ProcessSFTPResponseDTO> {
    this.logger.log("Starting federal restrictions import...");
    const uploadResult = await this.processingService.process();
    this.logger.log("Federal restrictions import process finished.");
    return {
      processSummary: uploadResult.processSummary,
      errorsSummary: uploadResult.errorsSummary,
    } as ProcessSFTPResponseDTO;
  }

  @InjectLogger()
  logger: LoggerService;
}
