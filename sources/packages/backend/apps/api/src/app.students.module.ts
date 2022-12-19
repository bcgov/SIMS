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
  MSFAANumberService,
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
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { ApplicationControllerService } from "./route-controllers/application/application.controller.service";
import { StudentAccountApplicationsService } from "./services/student-account-applications/student-account-applications.service";
import { ATBCStudentController } from "./route-controllers/atbc/atbc.students.controller";
import { WorkflowClientService, SequenceControlService } from "@sims/services";
import {
  SFASIndividualService,
  SFASApplicationService,
  SFASPartTimeApplicationsService,
} from "@sims/services/sfas";
import { ConfigModule } from "@sims/utilities/config";
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
  ],
})
export class AppStudentsModule {}
