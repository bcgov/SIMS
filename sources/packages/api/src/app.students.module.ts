import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import {
  ApplicationService,
  FormService,
  StudentService,
  WorkflowActionsService,
  ProgramYearService,
  EducationProgramOfferingService,
  SFASApplicationService,
  SFASPartTimeApplicationsService,
  ConfigService,
  DisbursementScheduleService,
  InstitutionLocationService,
  EducationProgramService,
  SequenceControlService,
  StudentFileService,
  MSFAANumberService,
  SFASIndividualService,
  WorkflowService,
  StudentRestrictionService,
  DesignationAgreementLocationService,
  StudentAssessmentService,
  StudentAppealService,
  StudentAppealRequestsService,
  GCNotifyService,
  GCNotifyActionsService,
  ATBCService,
  RestrictionService,
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
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { LoggerModule } from "./logger/logger.module";
import { ApplicationControllerService } from "./route-controllers/application/application.controller.service";
import { StudentAccountApplicationsService } from "./services/student-account-applications/student-account-applications.service";

@Module({
  imports: [LoggerModule, DatabaseModule, AuthModule],
  controllers: [
    ApplicationStudentsController,
    StudentStudentsController,
    StudentAppealStudentsController,
    InstitutionLocationStudentsController,
    AssessmentStudentsController,
    EducationProgramStudentsController,
    StudentAccountApplicationStudentsController,
    EducationProgramOfferingStudentsController,
  ],
  providers: [
    ApplicationService,
    FormService,
    StudentService,
    WorkflowActionsService,
    ProgramYearService,
    EducationProgramOfferingService,
    SFASApplicationService,
    SFASPartTimeApplicationsService,
    ConfigService,
    DisbursementScheduleService,
    InstitutionLocationService,
    EducationProgramService,
    SequenceControlService,
    StudentFileService,
    MSFAANumberService,
    SFASIndividualService,
    WorkflowService,
    StudentRestrictionService,
    DesignationAgreementLocationService,
    StudentAssessmentService,
    ApplicationControllerService,
    StudentAppealService,
    StudentAppealRequestsService,
    GCNotifyService,
    GCNotifyActionsService,
    AssessmentControllerService,
    StudentControllerService,
    ATBCService,
    RestrictionService,
    StudentAccountApplicationsService,
    EducationProgramOfferingControllerService,
  ],
})
export class AppStudentsModule {}
