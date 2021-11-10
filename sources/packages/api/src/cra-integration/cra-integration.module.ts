import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import {
  ApplicationService,
  ConfigService,
  CRAIntegrationService,
  CRAPersonalVerificationService,
  MSFAANumberService,
  SequenceControlService,
  SshService,
  StudentFileService,
  StudentService,
  WorkflowActionsService,
  WorkflowService,
  CRAIncomeVerificationService,
  SFASIndividualService,
} from "../services";

@Module({
  imports: [AuthModule],
  providers: [
    SshService,
    CRAIntegrationService,
    CRAPersonalVerificationService,
    SequenceControlService,
    StudentService,
    ConfigService,
    ApplicationService,
    StudentFileService,
    WorkflowService,
    WorkflowActionsService,
    MSFAANumberService,
    CRAIncomeVerificationService,
    SFASIndividualService,
  ],
  exports: [
    CRAPersonalVerificationService,
    CRAIntegrationService,
    CRAIncomeVerificationService,
  ],
})
export class CraIntegrationModule {}
