import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseModule } from "./database/database.module";
import { RouterModule } from "@nestjs/core";
import {
  StudentService,
  UserService,
  ConfigService,
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
  DisbursementScheduleService,
  DisbursementScheduleErrorsService,
  RestrictionService,
  InstitutionRestrictionService,
  DesignationAgreementService,
  SINValidationService,
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
  SFASIntegrationController,
  ECertIntegrationController,
  FedRestrictionsIntegrationController,
  NotesController,
  RestrictionController,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { LoggerModule } from "./logger/logger.module";
import { CraIntegrationModule } from "./cra-integration/cra-integration.module";
import { MSFAAIntegrationModule } from "./esdc-integration/msfaa-integration/msfaa-integration.module";
import { SFASIntegrationModule } from "./sfas-integration/sfas-integration.module";
import { ECertFullTimeIntegrationModule } from "./esdc-integration/e-cert-full-time-integration/e-cert-full-time-integration.module";
import { FedRestrictionIntegrationModule } from "./esdc-integration/fed-restriction-integration/fed-restriction-integration.module";
import { AppAESTModule } from "./app.aest.module";
import { AppInstitutionModule } from "./app.institution.module";
import { ClientTypeBaseRoute } from "./types";

@Module({
  imports: [
    LoggerModule,
    DatabaseModule,
    AuthModule,
    CraIntegrationModule,
    MSFAAIntegrationModule,
    SFASIntegrationModule,
    ECertFullTimeIntegrationModule,
    FedRestrictionIntegrationModule,
    AppAESTModule,
    AppInstitutionModule,
    RouterModule.register([
      {
        path: ClientTypeBaseRoute.Institution,
        module: AppInstitutionModule,
      },
      {
        path: ClientTypeBaseRoute.AEST,
        module: AppAESTModule,
      },
    ]),
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
    SFASIntegrationController,
    ECertIntegrationController,
    FedRestrictionsIntegrationController,
    NotesController,
    RestrictionController,
  ],
  providers: [
    AppService,
    UserService,
    StudentService,
    InstitutionService,
    ConfigService,
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
    DisbursementScheduleService,
    DisbursementScheduleErrorsService,
    RestrictionService,
    InstitutionRestrictionService,
    DesignationAgreementService,
    SINValidationService,
  ],
})
export class AppModule {}
