import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import {
  ApplicationService,
  CRAIntegrationService,
  CRAPersonalVerificationService,
  MSFAANumberService,
  StudentFileService,
  StudentService,
  CRAIncomeVerificationService,
  SFASIndividualService,
  SINValidationService,
  SFASApplicationService,
  SFASPartTimeApplicationsService,
  StudentRestrictionService,
  RestrictionService,
  EducationProgramOfferingService,
  EducationProgramOfferingValidationService,
} from "../services";
import { SequenceControlService, WorkflowClientService } from "@sims/services";
import { ConfigModule } from "@sims/utilities/config";
import { SshService } from "@sims/integrations/services";

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
    RestrictionService,
    StudentRestrictionService,
    EducationProgramOfferingService,
    EducationProgramOfferingValidationService,
    WorkflowClientService,
  ],
  exports: [
    CRAPersonalVerificationService,
    CRAIntegrationService,
    CRAIncomeVerificationService,
  ],
})
export class CraIntegrationModule {}
