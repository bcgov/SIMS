import { Controller, Post } from "@nestjs/common";
import { CRAPersonalVerificationService } from "../../services";
import { CRAValidationResultDto } from "./models/cra-validation-result.dto";
import { ProcessResponseResDto } from "./models/process-response.res.dto";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";

@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("system-access/cra-integration")
@ApiTags("system-access")
export class CRAIntegrationController extends BaseController {
  constructor(private readonly cra: CRAPersonalVerificationService) {
    super();
  }

  /**
   * Identifies all the students that still do not have their SIN
   * validated and create the validation request file
   * to be processed by CRA.
   * @returns Processing result log.
   */
  @Post("process-sin-validation")
  async processSinValidation(): Promise<CRAValidationResultDto> {
    this.logger.log("Executing SIN validation...");
    const uploadResult = await this.cra.createSinValidationRequest();
    this.logger.log("SIN validation executed.");
    return {
      generatedFile: uploadResult.generatedFile,
      uploadedRecords: uploadResult.uploadedRecords,
    };
  }

  /**
   * Identifies all the student applications that have a pending
   * income verification and generate the request file to be
   * processed by CRA.
   * @returns Processing result log.
   */
  @Post("process-income-verification")
  async processIncomeVerification(): Promise<CRAValidationResultDto> {
    this.logger.log("Executing income validation...");
    const uploadResult = await this.cra.createIncomeVerificationRequest();
    this.logger.log("Income validation executed.");
    return {
      generatedFile: uploadResult.generatedFile,
      uploadedRecords: uploadResult.uploadedRecords,
    };
  }

  /**
   * Download all files from CRA Response folder on SFTP and process them all.
   * @returns Summary with what was processed and the list of all errors, if any.
   */
  @Post("process-responses")
  async processResponses(): Promise<ProcessResponseResDto[]> {
    const results = await this.cra.processResponses();
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
