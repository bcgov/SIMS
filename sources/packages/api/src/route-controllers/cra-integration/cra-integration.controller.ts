import { Controller, Post, Scope } from "@nestjs/common";
import { CRAPersonalVerificationService } from "../../services";
import { CreateSinValidationResDto } from "./models/create-sin-validation.res.dto";

@Controller("cra-integration")
export class CRAIntegrationController {
  constructor(private readonly cra: CRAPersonalVerificationService) {}

  @Post("sin-validation")
  async createSinValidation(): Promise<CreateSinValidationResDto> {
    const uploadResult = await this.cra.createSinValidationRequest();
    return {
      generatedFile: uploadResult.generatedFile,
      uploadedRecords: uploadResult.uploadedRecords,
    };
  }
}
