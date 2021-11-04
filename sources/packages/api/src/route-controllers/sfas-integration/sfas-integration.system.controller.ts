import { Controller, Post } from "@nestjs/common";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ProcessResponseDTO } from "./models/sfas-integration.dto";
import { SFASIntegrationProcessingService } from "../../sfas-integration/sfas-integration-processing.service";

@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("system-access/sfas-integration")
export class SFASIntegrationController {
  constructor(private readonly sfas: SFASIntegrationProcessingService) {}

  @Post("process")
  async processSinValidation(): Promise<ProcessResponseDTO> {
    this.logger.log("Executing SFAS integration...");
    await this.sfas.process();
    this.logger.log("SFAS integration executed.");
    return null;
  }

  @InjectLogger()
  logger: LoggerService;
}
