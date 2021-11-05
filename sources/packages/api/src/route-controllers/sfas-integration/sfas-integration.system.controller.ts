import { Controller, Post, UnprocessableEntityException } from "@nestjs/common";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { SFASIntegrationProcessingService } from "../../sfas-integration/sfas-integration-processing.service";
import { ProcessSftpResponseResult } from "../../sfas-integration/sfas-integration.models";

@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("system-access/sfas-integration")
export class SFASIntegrationController {
  constructor(private readonly sfas: SFASIntegrationProcessingService) {}

  @Post("process")
  async processSinValidation(): Promise<ProcessSftpResponseResult[]> {
    this.logger.log("Executing SFAS integration...");
    const results = await this.sfas.process();
    if (results.some((result) => !result.success)) {
      throw new UnprocessableEntityException(results);
    }

    return results;
  }

  @InjectLogger()
  logger: LoggerService;
}
