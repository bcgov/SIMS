import { Controller, Post, UnprocessableEntityException } from "@nestjs/common";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { SFASIntegrationProcessingService } from "../../sfas-integration/sfas-integration-processing.service";
import { ProcessResultDTO } from "./models/sfas-integration.dto";
import { ApiTags } from "@nestjs/swagger";

@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("system-access/sfas-integration")
@ApiTags("system-access")
export class SFASIntegrationController {
  constructor(private readonly sfas: SFASIntegrationProcessingService) {}

  /**
   * Process all SFAS integration files from the SFTP,
   * inserting or updating the records.
   */
  @Post("process")
  async processSinValidation(): Promise<ProcessResultDTO[]> {
    this.logger.log("Executing SFAS integration...");
    const results = await this.sfas.process();
    this.logger.log("SFAS integration process executed.");
    const resultDTO = results.map((result) => ({
      summary: result.summary,
      success: result.success,
    }));

    if (results.some((result) => !result.success)) {
      // If any result was not successfully completed, return
      // the entire processing log but within an HTTP error.
      throw new UnprocessableEntityException(resultDTO);
    }

    return resultDTO;
  }

  @InjectLogger()
  logger: LoggerService;
}
