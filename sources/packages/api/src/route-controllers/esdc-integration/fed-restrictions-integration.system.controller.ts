import { Controller, Post } from "@nestjs/common";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { FedRestrictionProcessingService } from "../../esdc-integration/fed-restriction-integration/fed-restriction-processing.service";
import { ESDCFileResponseDTO } from "./models/esdc-model";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";

@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("system-access/fed-restrictions")
@ApiTags("system-access")
export class FedRestrictionsIntegrationController extends BaseController {
  constructor(
    private readonly processingService: FedRestrictionProcessingService,
  ) {
    super();
  }

  @Post("process")
  async processFedRestrictionsImport(): Promise<ESDCFileResponseDTO> {
    this.logger.log("Starting federal restrictions import...");
    const uploadResult = await this.processingService.process();
    this.logger.log("Federal restrictions import process finished.");
    return {
      processSummary: uploadResult.processSummary,
      errorsSummary: uploadResult.errorsSummary,
    } as ESDCFileResponseDTO;
  }

  @InjectLogger()
  logger: LoggerService;
}
