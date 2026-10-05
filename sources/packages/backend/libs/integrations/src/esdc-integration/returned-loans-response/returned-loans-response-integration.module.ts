import { Module } from "@nestjs/common";
import { ConfigModule } from "@sims/utilities/config";
import { SshService } from "@sims/integrations/services";
import { ReturnedLoansResponseIntegrationService } from "./returned-loans-response.integration.service";
import { ReturnedLoansResponseProcessingService } from "./returned-loans-response.processing.service";

@Module({
  imports: [ConfigModule],
  providers: [
    SshService,
    ReturnedLoansResponseIntegrationService,
    ReturnedLoansResponseProcessingService,
  ],
  exports: [ReturnedLoansResponseProcessingService],
})
export class ReturnedLoansResponseIntegrationModule {}
