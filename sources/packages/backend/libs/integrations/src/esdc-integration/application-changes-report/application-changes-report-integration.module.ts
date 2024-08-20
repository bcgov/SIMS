import { Module } from "@nestjs/common";
import { ConfigModule } from "@sims/utilities/config";
import { ApplicationService, SshService } from "@sims/integrations/services";
import {
  ApplicationChangesReportIntegrationService,
  ApplicationChangesReportProcessingService,
} from "@sims/integrations/esdc-integration";

@Module({
  imports: [ConfigModule],
  providers: [
    SshService,
    ApplicationService,
    ApplicationChangesReportIntegrationService,
    ApplicationChangesReportProcessingService,
  ],
  exports: [ApplicationChangesReportProcessingService],
})
export class ApplicationChangesReportIntegrationModule {}
