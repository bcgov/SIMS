import { Module } from "@nestjs/common";
import {
  ApplicationService,
  FormService,
  StudentService,
  ProgramYearService,
  EducationProgramOfferingService,
  DisbursementSchedulerService,
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
  EducationProgramOfferingControllerService,
  RestrictionStudentsController,
  ProgramYearStudentsController,
  ApplicationControllerService,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { ConfigModule } from "@sims/utilities/config";
import { ATBCStudentController } from "./route-controllers/atbc/atbc.students.controller";
import {
  SequenceControlService,
  StudentRestrictionsService,
  WorkflowClientService,
} from "@sims/services";
import { MSFAANumberService } from "@sims/integrations/services";
import {
  SFASIndividualService,
  SFASApplicationService,
  SFASPartTimeApplicationsService,
} from "@sims/services/sfas";
import { ATBCIntegrationModule } from "@sims/integrations/atbc-integration";

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
    ATBCStudentController,
    ProgramYearStudentsController,
  ],
  providers: [
    WorkflowClientService,
    ApplicationService,
    FormService,
    StudentService,
    ProgramYearService,
    EducationProgramOfferingService,
    DisbursementSchedulerService,
    InstitutionLocationService,
    EducationProgramService,
    SequenceControlService,
    StudentFileService,
    MSFAANumberService,
    SFASIndividualService,
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
    StudentRestrictionsService,
  ],
})
export class AppStudentsModule {}
