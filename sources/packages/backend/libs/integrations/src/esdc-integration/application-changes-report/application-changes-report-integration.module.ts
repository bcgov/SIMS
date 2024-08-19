import { Module } from "@nestjs/common";
import { ConfigModule } from "@sims/utilities/config";
import { ApplicationService, SshService } from "@sims/integrations/services";
import { ApplicationChangesReportProcessingService } from "@sims/integrations/esdc-integration";

@Module({
  imports: [ConfigModule],
  providers: [
    SshService,
    ApplicationService,
    ApplicationChangesReportProcessingService,
  ],
  exports: [ApplicationChangesReportProcessingService],
})
export class ApplicationChangesReportIntegrationModule {}
