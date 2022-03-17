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
} from "./services";
import { ApplicationStudentsController } from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { LoggerModule } from "./logger/logger.module";

@Module({
  imports: [LoggerModule, DatabaseModule, AuthModule],
  controllers: [ApplicationStudentsController],
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
  ],
})
export class AppStudentsModule {}
