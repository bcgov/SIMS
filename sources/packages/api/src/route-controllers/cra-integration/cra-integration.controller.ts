import { Controller, Get, Inject, Post, Scope } from "@nestjs/common";
import { Public } from "src/auth/decorators/public.decorator";
import { CraStudentIntegrationService } from "../../services";

@Controller({ path: "cra-integration", scope: Scope.REQUEST })
export class CraIntegrationController {
  constructor(private readonly cra: CraStudentIntegrationService) {}

  @Public()
  @Post("sin-validation")
  async createMatchingRun(): Promise<any> {
    await this.cra.createSinValidationRequest();
  }
}
