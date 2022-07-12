import { Controller, Post, UnprocessableEntityException } from "@nestjs/common";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { SFASIntegrationProcessingService } from "../../sfas-integration/sfas-integration-processing.service";
import { ProcessResultAPIOutDTO } from "./models/sfas-integration.dto";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute } from "../../types";

@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("sfas-integration")
// todo: test all endpoints
@ApiTags(`${ClientTypeBaseRoute.SystemAccess}-sfas-integration`)
export class SFASIntegrationSystemAccessController extends BaseController {
  constructor(private readonly sfas: SFASIntegrationProcessingService) {
    super();
  }

  /**
   * Process all SFAS integration files from the SFTP,
   * inserting or updating the records.
   */
  @Post("process")
  async processSinValidation(): Promise<ProcessResultAPIOutDTO[]> {
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
