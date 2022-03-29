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
  SINValidationService,
  DesignationAgreementLocationService,
  StudentAssessmentService,
} from "./services";
import {
  UserController,
  StudentController,
  ProgramYearController,
  InstitutionController,
  ConfigController,
  DynamicFormController,
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
import { AppInstitutionsModule } from "./app.institutions.module";
import { ClientTypeBaseRoute } from "./types";
import { AppStudentsModule } from "./app.students.module";
import { AppSystemAccessModule } from "./app.system-access.module";
import { InstitutionLocationsControllerService } from "./route-controllers/institution-locations/institution-locations.controller.service";

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
    AppInstitutionsModule,
    AppStudentsModule,
    AppSystemAccessModule,
    RouterModule.register([
      {
        path: ClientTypeBaseRoute.Institution,
        module: AppInstitutionsModule,
      },
      {
        path: ClientTypeBaseRoute.AEST,
        module: AppAESTModule,
      },
      {
        path: ClientTypeBaseRoute.Student,
        module: AppStudentsModule,
      },
      {
        path: ClientTypeBaseRoute.SystemAccess,
        module: AppSystemAccessModule,
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
    SINValidationService,
    DesignationAgreementLocationService,
    StudentAssessmentService,
    InstitutionLocationsControllerService,
  ],
})
export class AppModule {}
