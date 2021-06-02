import { Controller, Post } from "@nestjs/common";
import { CRAPersonalVerificationService } from "../../services";
import { CreateSinValidationResDto } from "./models/create-sin-validation.res.dto";
import { ProcessResponseResDto } from "./models/process-response.res.dto";

@Controller("cra-integration")
export class CRAIntegrationController {
  constructor(private readonly cra: CRAPersonalVerificationService) {}

  /**
   * Identifies all the students that still do not have their SIN
   * validated and create the validation request file
   * to be processed by CRA.
   * @returns SIN validation request.
   */
  @Post("sin-validation")
  async createSinValidation(): Promise<CreateSinValidationResDto> {
    const uploadResult = await this.cra.createSinValidationRequest();
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
}
