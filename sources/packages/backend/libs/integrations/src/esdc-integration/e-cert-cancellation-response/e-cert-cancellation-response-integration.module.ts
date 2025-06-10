import { Module } from "@nestjs/common";
import { ConfigModule } from "@sims/utilities/config";
import { SshService } from "@sims/integrations/services";
import { ECertCancellationResponseIntegrationService } from "./e-cert-cancellation-response.integration.service";
import { ECertCancellationResponseProcessingService } from "./e-cert-cancellation-response.processing.service";

@Module({
  imports: [ConfigModule],
  providers: [
    SshService,
    ECertCancellationResponseIntegrationService,
    ECertCancellationResponseProcessingService,
  ],
  exports: [ECertCancellationResponseProcessingService],
})
export class ECertCancellationResponseIntegrationModule {}
