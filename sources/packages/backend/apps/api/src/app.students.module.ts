import { Module } from "@nestjs/common";
import {
  ApplicationService,
  FormService,
  StudentService,
  ProgramYearService,
  EducationProgramOfferingService,
  SFASApplicationService,
  SFASPartTimeApplicationsService,
  DisbursementScheduleService,
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
import { ConfigModule } from "@sims/utilities/config";
import { MSFAANumberService } from "@sims/integrations/services/msfaa-number/msfaa-number.service";
import { StudentRestrictionService as StudentRestrictionsService } from "@sims/integrations/services/restriction/student-restriction.service";

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
    DisbursementScheduleService,
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
    // todo: ann review the StudentRestrictionService
    StudentRestrictionsService,
  ],
})
export class AppStudentsModule {}
