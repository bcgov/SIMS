import { Module } from "@nestjs/common";
import {
  StudentService,
  ApplicationExceptionService,
  EducationProgramOfferingService,
  StudentAssessmentService,
  RestrictionService,
  SupportingUserService,
  CRAIncomeVerificationService,
  ApplicationService,
  StudentFileService,
  DisbursementReceiptService,
  DesignationAgreementLocationService,
  EducationProgramService,
  EducationProgramOfferingValidationService,
  StudentAppealService,
  StudentAppealRequestsService,
  StudentScholasticStandingsService,
  StudentRestrictionService,
} from "./services";
import {
  AssessmentControllerService,
  ApplicationSystemAccessController,
} from "./route-controllers";
import {
  WorkflowClientService,
  SequenceControlService,
  DisbursementSchedulerService,
} from "@sims/services";
import { StudentRestrictionsService } from "@sims/integrations/services";
import { AuthModule } from "./auth/auth.module";
import {
  SFASIndividualService,
  SFASApplicationService,
  SFASPartTimeApplicationsService,
} from "@sims/services/sfas";

@Module({
  imports: [AuthModule],
  controllers: [ApplicationSystemAccessController],
  providers: [
    WorkflowClientService,
    StudentService,
    StudentAssessmentService,
    EducationProgramOfferingService,
    DisbursementSchedulerService,
    SequenceControlService,
    StudentRestrictionService,
    AssessmentControllerService,
    RestrictionService,
    ApplicationExceptionService,
    SupportingUserService,
    CRAIncomeVerificationService,
    ApplicationService,
    StudentFileService,
    SFASIndividualService,
    SFASApplicationService,
    SFASPartTimeApplicationsService,
    DisbursementReceiptService,
    DesignationAgreementLocationService,
    EducationProgramService,
    EducationProgramOfferingValidationService,
    StudentAppealService,
    StudentAppealRequestsService,
    StudentScholasticStandingsService,
    StudentRestrictionsService,
  ],
})
export class AppSystemAccessModule {}
