import { Module } from "@nestjs/common";
import { SequenceControlService, WorkflowClientService } from "@sims/services";
import { ConfigModule } from "@sims/utilities/config";
import {
  CRAIncomeVerificationsService,
  SshService,
} from "@sims/integrations/services";
import { CRAIntegrationService } from "./cra-integration.service";
import { CRAPersonalVerificationService } from "./cra-personal-verification.service";

@Module({
  imports: [ConfigModule],
  providers: [
    SshService,
    CRAIntegrationService,
    CRAPersonalVerificationService,
    SequenceControlService,
    WorkflowClientService,
    CRAIncomeVerificationsService,
  ],
  exports: [CRAPersonalVerificationService, CRAIntegrationService],
})
export class CRAIntegrationModule {}
