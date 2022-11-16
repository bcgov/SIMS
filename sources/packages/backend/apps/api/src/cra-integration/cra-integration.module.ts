import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import {
  ApplicationService,
  CRAIntegrationService,
  CRAPersonalVerificationService,
  MSFAANumberService,
  SshService,
  StudentFileService,
  StudentService,
  CRAIncomeVerificationService,
  SFASIndividualService,
  SINValidationService,
  SFASApplicationService,
  SFASPartTimeApplicationsService,
  GCNotifyService,
  GCNotifyActionsService,
  StudentRestrictionService,
  RestrictionService,
  EducationProgramOfferingService,
  EducationProgramOfferingValidationService,
  NotificationService,
  NotificationMessageService,
} from "../services";
import { SequenceControlService, WorkflowClientService } from "@sims/services";
import { ConfigModule } from "@sims/utilities/config";

@Module({
  imports: [AuthModule, ConfigModule],
  providers: [
    SshService,
    CRAIntegrationService,
    CRAPersonalVerificationService,
    SequenceControlService,
    StudentService,
    ApplicationService,
    StudentFileService,
    MSFAANumberService,
    CRAIncomeVerificationService,
    SFASIndividualService,
    SINValidationService,
    SFASApplicationService,
    SFASPartTimeApplicationsService,
    GCNotifyService,
    GCNotifyActionsService,
    RestrictionService,
    StudentRestrictionService,
    EducationProgramOfferingService,
    EducationProgramOfferingValidationService,
    WorkflowClientService,
    NotificationService,
    NotificationMessageService,
  ],
  exports: [
    CRAPersonalVerificationService,
    CRAIntegrationService,
    CRAIncomeVerificationService,
  ],
})
export class CraIntegrationModule {}
