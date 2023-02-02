import { Module } from "@nestjs/common";
import { SequenceControlService, WorkflowClientService } from "@sims/services";
import { ConfigModule } from "@sims/utilities/config";
import {
  CRAIncomeVerificationsService,
  SshService,
} from "@sims/integrations/services";
import { CRAIntegrationService } from "./cra.integration.service";
import { CRAIncomeVerificationProcessingService } from "./cra-income-verification.processing.service";

@Module({
  imports: [ConfigModule],
  providers: [
    SshService,
    CRAIntegrationService,
    CRAIncomeVerificationProcessingService,
    SequenceControlService,
    WorkflowClientService,
    CRAIncomeVerificationsService,
  ],
  exports: [
    CRAIncomeVerificationProcessingService,
    CRAIntegrationService,
    CRAIncomeVerificationsService,
  ],
})
export class CRAIntegrationModule {}
