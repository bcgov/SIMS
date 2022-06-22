import { Controller, Post } from "@nestjs/common";
import { ProcessResponseResDto } from "./models/msfaa-file-result.dto";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { AllowAuthorizedParty, UserToken } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute } from "../../types";
import { SINValidationProcessingService } from "../../esdc-integration/sin-validation/sin-validation-processing.service";
import { ESDCFileResultDTO } from "./models/esdc-model";
import { IUserToken } from "../../auth/userToken.interface";

@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("sin-validation")
@ApiTags(`${ClientTypeBaseRoute.SystemAccess}-sin-validation`)
export class SINValidationSystemAccessController extends BaseController {
  constructor(
    private readonly sinValidationProcessingService: SINValidationProcessingService,
  ) {
    super();
  }

  /**
   * Identifies all the students that still do not have their SIN
   * validated and create the validation request for ESDC processing.
   * @returns processing result log.
   */
  @Post("process-request")
  async processMSFAARequest(
    @UserToken() userToken: IUserToken,
  ): Promise<ESDCFileResultDTO> {
    this.logger.log("Sending ESDC SIN validation request file.");
    const uploadResult =
      await this.sinValidationProcessingService.uploadSINValidationRequests(
        userToken.userId,
      );
    this.logger.log("ESDC SIN validation request file sent.");
    return {
      generatedFile: uploadResult.generatedFile,
      uploadedRecords: uploadResult.uploadedRecords,
    };
  }

  /**
   * Download all SIN validation files from ESDC response folder on SFTP and process them all.
   * @returns summary with what was processed and the list of all errors, if any.
   */
  @Post("process-responses")
  async processResponses(
    @UserToken() userToken: IUserToken,
  ): Promise<ProcessResponseResDto[]> {
    this.logger.log("Processing ESDC SIN validation response files.");
    const results = await this.sinValidationProcessingService.processResponses(
      userToken.userId,
    );
    this.logger.log("ESDC SIN validation response files processed.");
    return results.map((result) => {
      return {
        processSummary: result.processSummary,
        errorsSummary: result.errorsSummary,
      };
    });
  }

  @InjectLogger()
  logger: LoggerService;
}
