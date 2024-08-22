import { Module } from "@nestjs/common";
import { ConfigModule } from "@sims/utilities/config";
import {
  ApplicationService,
  SshService,
  StudentAssessmentService,
} from "@sims/integrations/services";
import {
  ApplicationChangesReportIntegrationService,
  ApplicationChangesReportProcessingService,
} from "@sims/integrations/esdc-integration";
import { SystemUserModule } from "@sims/services";

@Module({
  imports: [ConfigModule, SystemUserModule],
  providers: [
    SshService,
    ApplicationService,
    StudentAssessmentService,
    ApplicationChangesReportIntegrationService,
    ApplicationChangesReportProcessingService,
  ],
  exports: [ApplicationChangesReportProcessingService],
})
export class ApplicationChangesReportIntegrationModule {}
