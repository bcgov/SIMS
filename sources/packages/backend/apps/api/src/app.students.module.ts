import { Module } from "@nestjs/common";
import {
  ApplicationService,
  FormService,
  StudentService,
  ProgramYearService,
  EducationProgramOfferingService,
  SFASApplicationService,
  SFASPartTimeApplicationsService,
  DisbursementSchedulerService,
  InstitutionLocationService,
  EducationProgramService,
  StudentFileService,
  SFASIndividualService,
  StudentRestrictionService,
  DesignationAgreementLocationService,
  StudentAssessmentService,
  StudentAppealService,
  StudentAppealRequestsService,
  ATBCService,
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
import { SequenceControlService, WorkflowClientService } from "@sims/services";
import {
  MSFAANumberService,
  IntegrationStudentRestrictionService,
} from "@sims/integrations/services";

@Module({
  imports: [AuthModule, ConfigModule],
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
    SFASApplicationService,
    SFASPartTimeApplicationsService,
    DisbursementSchedulerService,
    InstitutionLocationService,
    EducationProgramService,
    SequenceControlService,
    StudentFileService,
    MSFAANumberService,
    SFASIndividualService,
    StudentRestrictionService,
    DesignationAgreementLocationService,
    StudentAssessmentService,
    ApplicationControllerService,
    StudentAppealService,
    StudentAppealRequestsService,
    AssessmentControllerService,
    StudentControllerService,
    ATBCService,
    RestrictionService,
    StudentAccountApplicationsService,
    EducationProgramOfferingControllerService,
    EducationProgramOfferingValidationService,
    DisbursementReceiptService,
    ApplicationExceptionService,
    StudentScholasticStandingsService,
    CRAIncomeVerificationService,
    SupportingUserService,
    IntegrationStudentRestrictionService,
  ],
})
export class AppStudentsModule {}
