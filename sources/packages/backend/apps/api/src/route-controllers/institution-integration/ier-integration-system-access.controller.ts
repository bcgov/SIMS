import { Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { InjectLogger } from "../../common";
import { IER12FileService } from "../../institution-integration/ier-integration/ier12-file.service";
import { LoggerService } from "../../logger/logger.service";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import { IER12ResultAPIOutDTO } from "./models/ier.dto";

@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("ier-integration")
@ApiTags(`${ClientTypeBaseRoute.SystemAccess}-ier-integration`)
export class IERIntegrationSystemAccessController extends BaseController {
  constructor(private readonly ierRequest: IER12FileService) {
    super();
  }

  /**
   * Identifies all the applications which are in assessment
   * for a particular institution and generate the request file.
   * @returns Processing result log.
   */
  @Post("process-ier-12")
  async processIER12File(
    generatedDate?: Date,
  ): Promise<IER12ResultAPIOutDTO[]> {
    this.logger.log("Executing IER 12 file generation ...");
    const uploadResult = await this.ierRequest.processIER12File(generatedDate);
    this.logger.log("IER 12 file generation completed.");
    return uploadResult;
  }
  @InjectLogger()
  logger: LoggerService;
}
