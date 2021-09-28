import { Body, Controller, Post } from "@nestjs/common";
import {
  CRAIncomeVerificationService,
  CRAPersonalVerificationService,
} from "../../services";
import { CRAValidationResultDto } from "./models/cra-validation-result.dto";
import { ProcessResponseResDto } from "./models/process-response.res.dto";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { CreateIncomeVerificationDto } from "./models/create-income-verification.dto";

@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("system-access/cra-integration")
export class CRAIntegrationController {
  constructor(
    private readonly cra: CRAPersonalVerificationService,
    private readonly incomeVerificationService: CRAIncomeVerificationService,
  ) {}

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
   * Download all files from CRA Response folder on sFTP and process them all.
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

  /**
   * Creates a CRA Income Verification record that will be waiting
   * to be send to CRA and receive a response.
   * @param payload information needed to create the CRA Income Verification record.
   * @returns the id of the new CRA Verification record created.
   */
  @Post("income-verification")
  async createIncomeVerification(
    @Body() payload: CreateIncomeVerificationDto,
  ): Promise<number> {
    const incomeVerification =
      await this.incomeVerificationService.createIncomeVerification(
        payload.applicationId,
        payload.taxYear,
        payload.reportedIncome,
      );
    return incomeVerification.id;
  }

  @InjectLogger()
  logger: LoggerService;
}
