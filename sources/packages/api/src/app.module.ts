import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseModule } from "./database/database.module";
import {
  StudentService,
  UserService,
  ConfigService,
  ArchiveDbService,
  InstitutionService,
  ApplicationService,
  BCeIDServiceProvider,
  InstitutionUserAuthService,
  EducationProgramService,
  EducationProgramOfferingService,
  WorkflowActionsService,
  WorkflowService,
  FormService,
  InstitutionLocationService,
  FormsFlowService,
  ATBCService,
  StudentFileService,
  ProgramYearService,
  SequenceControlService,
  InstitutionTypeService,
  PIRDeniedReasonService,
  MSFAANumberService,
  COEDeniedReasonService,
  CRAIncomeVerificationService,
  SupportingUserService,
  StudentRestrictionService,
} from "./services";
import {
  UserController,
  StudentController,
  ProgramYearController,
  InstitutionController,
  ConfigController,
  DynamicFormController,
  ApplicationController,
  InstitutionLocationsController,
  CRAIntegrationController,
  EducationProgramController,
  EducationProgramOfferingController,
  ApplicationSystemController,
  ATBCController,
  ProgramInfoRequestController,
  ConfirmationOfEnrollmentController,
  InstitutionTypeController,
  SupportingUserController,
  MSFAAIntegrationController,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { LoggerModule } from "./logger/logger.module";
import { CraIntegrationModule } from "./cra-integration/cra-integration.module";
import { MSFAAIntegrationModule } from "./msfaa-integration/msfaa-integration.module";
import { SFASIntegrationModule } from "./sfas-integration/sfas-integration.module";
// Test
@Module({
  imports: [
    LoggerModule,
    DatabaseModule,
    AuthModule,
    CraIntegrationModule,
    MSFAAIntegrationModule,
    SFASIntegrationModule,
  ],
  controllers: [
    AppController,
    UserController,
    StudentController,
    ProgramYearController,
    InstitutionController,
    ConfigController,
    DynamicFormController,
    ApplicationController,
    InstitutionLocationsController,
    CRAIntegrationController,
    EducationProgramController,
    EducationProgramOfferingController,
    ApplicationSystemController,
    ATBCController,
    ProgramInfoRequestController,
    ConfirmationOfEnrollmentController,
    InstitutionTypeController,
    SupportingUserController,
    MSFAAIntegrationController,
  ],
  providers: [
    AppService,
    UserService,
    StudentService,
    InstitutionService,
    ConfigService,
    ArchiveDbService,
    BCeIDServiceProvider,
    WorkflowService,
    WorkflowActionsService,
    FormService,
    ApplicationService,
    InstitutionLocationService,
    FormsFlowService,
    InstitutionUserAuthService,
    EducationProgramService,
    EducationProgramOfferingService,
    ATBCService,
    StudentFileService,
    ProgramYearService,
    SequenceControlService,
    InstitutionTypeService,
    PIRDeniedReasonService,
    MSFAANumberService,
    COEDeniedReasonService,
    CRAIncomeVerificationService,
    SupportingUserService,
    StudentRestrictionService,
  ],
})
export class AppModule {}
