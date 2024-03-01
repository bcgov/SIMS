import { Module } from "@nestjs/common";
import {
  ApplicationService,
  FormService,
  StudentService,
  ProgramYearService,
  EducationProgramOfferingService,
  DisbursementScheduleService,
  InstitutionLocationService,
  EducationProgramService,
  StudentFileService,
  StudentRestrictionService,
  DesignationAgreementLocationService,
  StudentAssessmentService,
  StudentAppealService,
  StudentAppealRequestsService,
  RestrictionService,
  EducationProgramOfferingValidationService,
  DisbursementReceiptService,
  ApplicationExceptionService,
  StudentScholasticStandingsService,
  CRAIncomeVerificationService,
  SupportingUserService,
  StudentAccountApplicationsService,
  ApplicationOfferingChangeRequestService,
} from "./services";
import {
  ApplicationStudentsController,
  StudentStudentsController,
  StudentAppealStudentsController,
  InstitutionLocationStudentsController,
  AssessmentStudentsController,
  AssessmentControllerService,
  StudentControllerService,
  EducationProgramStudentsController,
  StudentAccountApplicationStudentsController,
  EducationProgramOfferingStudentsController,
  ApplicationOfferingChangeRequestStudentsController,
  ApplicationOfferingChangeRequestControllerService,
  EducationProgramOfferingControllerService,
  RestrictionStudentsController,
  ProgramYearStudentsController,
  ApplicationControllerService,
  OverawardStudentsController,
  OverawardControllerService,
  StudentAppealControllerService,
  ScholasticStandingControllerService,
  ScholasticStandingStudentsController,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { ConfigModule } from "@sims/utilities/config";
import {
  DisbursementOverawardService,
  SequenceControlService,
  StudentRestrictionSharedService,
  WorkflowClientService,
  NoteSharedService,
  RestrictionSharedService,
  ConfirmationOfEnrollmentService,
} from "@sims/services";
import {
  SFASIndividualService,
  SFASApplicationService,
  SFASPartTimeApplicationsService,
} from "@sims/services/sfas";
import { ATBCIntegrationModule } from "@sims/integrations/atbc-integration";
import { SFASRestrictionService } from "@sims/integrations/services/sfas";

@Module({
  imports: [AuthModule, ConfigModule, ATBCIntegrationModule],
  controllers: [
    ApplicationStudentsController,
    StudentStudentsController,
    StudentAppealStudentsController,
    InstitutionLocationStudentsController,
    AssessmentStudentsController,
    EducationProgramStudentsController,
    StudentAccountApplicationStudentsController,
    EducationProgramOfferingStudentsController,
    RestrictionStudentsController,
    ProgramYearStudentsController,
    OverawardStudentsController,
    ApplicationOfferingChangeRequestStudentsController,
    ScholasticStandingStudentsController,
  ],
  providers: [
    WorkflowClientService,
    ApplicationService,
    FormService,
    StudentService,
    ProgramYearService,
    EducationProgramOfferingService,
    DisbursementScheduleService,
    InstitutionLocationService,
    EducationProgramService,
    SequenceControlService,
    StudentFileService,
    SFASIndividualService,
    SFASRestrictionService,
    SFASApplicationService,
    SFASPartTimeApplicationsService,
    StudentRestrictionService,
    DesignationAgreementLocationService,
    StudentAssessmentService,
    ApplicationControllerService,
    StudentAppealService,
    StudentAppealRequestsService,
    AssessmentControllerService,
    StudentControllerService,
    RestrictionService,
    StudentAccountApplicationsService,
    EducationProgramOfferingControllerService,
    EducationProgramOfferingValidationService,
    DisbursementReceiptService,
    ApplicationExceptionService,
    StudentScholasticStandingsService,
    CRAIncomeVerificationService,
    SupportingUserService,
    StudentRestrictionSharedService,
    RestrictionSharedService,
    DisbursementOverawardService,
    NoteSharedService,
    OverawardControllerService,
    StudentAppealControllerService,
    ConfirmationOfEnrollmentService,
    ApplicationOfferingChangeRequestControllerService,
    ApplicationOfferingChangeRequestService,
    ScholasticStandingControllerService,
  ],
})
export class AppStudentsModule {}
