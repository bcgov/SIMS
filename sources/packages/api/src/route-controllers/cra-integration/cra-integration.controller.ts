import { Controller, Get, Inject, Scope } from "@nestjs/common";
import { Public } from "src/auth/decorators/public.decorator";
import { ConfigService, CraIntegrationService } from "../../services";

@Controller({ path: "cra-integration", scope: Scope.REQUEST })
export class CraIntegrationController {
  constructor(private readonly cra: CraIntegrationService) {}

  @Public()
  @Get()
  async createFile(): Promise<any> {
    return await this.cra.createSinVerificationRequest([
      {
        sin: "485153696",
        individualSurname: "Sinclair",
        individualGivenName: "Tulip",
        individualBirthDate: new Date(1915, 6, 19),
      },
      {
        sin: "444652291",
        individualSurname: "Martin",
        individualGivenName: "Elizabeth",
        individualBirthDate: new Date(1975, 5, 9),
      },
      {
        sin: "713365021",
        individualSurname: "Gail",
        individualGivenName: "Gordon",
        individualBirthDate: new Date(1964, 4, 5),
      },
    ]);
  }
}
