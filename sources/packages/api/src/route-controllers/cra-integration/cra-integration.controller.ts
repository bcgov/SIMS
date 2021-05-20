import { Controller, Post, Scope } from "@nestjs/common";
import { CRAPersonalVerificationService } from "../../services";
import { CreateMatchingRunResDto } from "./models/create-matching-run.res.dto";

@Controller({ path: "cra-integration", scope: Scope.REQUEST })
export class CRAIntegrationController {
  constructor(private readonly cra: CRAPersonalVerificationService) {}

  @Post("sin-validation")
  async createMatchingRun(): Promise<CreateMatchingRunResDto> {
    const uploadResult = await this.cra.createSinValidationRequest();
    return {
      generatedFile: uploadResult.generatedFile,
      uploadedRecords: uploadResult.uploadedRecords,
    };
  }
}
