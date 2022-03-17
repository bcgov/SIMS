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
} from "./services";
import { ApplicationStudentController } from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { LoggerModule } from "./logger/logger.module";

@Module({
  imports: [LoggerModule, DatabaseModule, AuthModule],
  controllers: [ApplicationStudentController],
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
  ],
})
export class AppStudentModule {}
