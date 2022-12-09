import { Module } from "@nestjs/common";
import { SequenceControlService, WorkflowClientService } from "@sims/services";
import { ConfigModule } from "@sims/utilities/config";
import { SshService } from "@sims/integrations/services";
import { AuthModule } from "apps/api/src/auth/auth.module";
import { CRAIntegrationService } from "./cra-integration.service";
import { CRAPersonalVerificationService } from "./cra-personal-verification.service";
// todo:ann move thee functions
import // ApplicationService,
// SFASIndividualService,
// StudentFileService,
// StudentService,
// MSFAANumberService,
// CRAIncomeVerificationService,
// SINValidationService,
// SFASApplicationService,
// SFASPartTimeApplicationsService,
// RestrictionService,
// StudentRestrictionService,
// EducationProgramOfferingService,
// EducationProgramOfferingValidationService,
"apps/api/src/services";

@Module({
  imports: [AuthModule, ConfigModule],
  providers: [
    SshService,
    CRAIntegrationService,
    CRAPersonalVerificationService,
    SequenceControlService,
    // StudentService,
    // ApplicationService,
    // StudentFileService,
    // MSFAANumberService,
    // CRAIncomeVerificationService,
    // SFASIndividualService,
    // SINValidationService,
    // SFASApplicationService,
    // SFASPartTimeApplicationsService,
    // RestrictionService,
    // StudentRestrictionService,
    // EducationProgramOfferingService,
    // EducationProgramOfferingValidationService,
    WorkflowClientService,
  ],
  exports: [
    CRAPersonalVerificationService,
    CRAIntegrationService,
    // CRAIncomeVerificationService,
  ],
})
export class CraIntegrationModule {}
