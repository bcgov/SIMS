// Todo: remove this module when archive application `/route-controllers/application/application.system-access.controller.ts` is moved to integartion.
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
  DisbursementScheduleService,
  StudentRestrictionSharedService,
} from "@sims/services";
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
    DisbursementScheduleService,
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
    StudentRestrictionSharedService,
  ],
})
export class AppSystemAccessModule {}
