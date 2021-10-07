import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import {
  ApplicationService,
  ArchiveDbService,
  ConfigService,
  CRAIntegrationService,
  CRAPersonalVerificationService,
  KeycloakService,
  MSFAANumberService,
  SequenceControlService,
  SshService,
  StudentFileService,
  StudentService,
  TokensService,
  WorkflowActionsService,
  WorkflowService,
  CRAIncomeVerificationService,
} from "../services";

@Module({
  imports: [AuthModule],
  providers: [
    SshService,
    CRAIntegrationService,
    CRAPersonalVerificationService,
    SequenceControlService,
    StudentService,
    ArchiveDbService,
    ConfigService,
    ApplicationService,
    StudentFileService,
    WorkflowService,
    WorkflowActionsService,
    MSFAANumberService,
    TokensService,
    KeycloakService,
    CRAIncomeVerificationService,
  ],
  exports: [
    CRAPersonalVerificationService,
    CRAIntegrationService,
    CRAIncomeVerificationService,
  ],
})
export class CraIntegrationModule {}
