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
  ATBCService,
  StudentFileService,
  ProgramYearService,
  SequenceControlService,
  InstitutionTypeService,
  MSFAANumberService,
  StudentRestrictionService,
  RestrictionService,
  InstitutionRestrictionService,
  DesignationAgreementLocationService,
  GCNotifyService,
  GCNotifyActionsService,
} from "./services";
import {
  UserController,
  ProgramYearController,
  ConfigController,
  DynamicFormController,
  EducationProgramController,
  EducationProgramOfferingController,
  ATBCController,
  NotesController,
  RestrictionController,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { LoggerModule } from "./logger/logger.module";
import { CraIntegrationModule } from "./cra-integration/cra-integration.module";
import { MSFAAIntegrationModule } from "./esdc-integration/msfaa-integration/msfaa-integration.module";
import { SFASIntegrationModule } from "./sfas-integration/sfas-integration.module";
import { ECertIntegrationModule } from "./esdc-integration/e-cert-integration/e-cert-integration.module";
import { FedRestrictionIntegrationModule } from "./esdc-integration/fed-restriction-integration/fed-restriction-integration.module";
import { DisbursementReceiptIntegrationModule } from "./esdc-integration/disbursement-receipt-integration/disbursement-receipt-integration.module";
import { AppAESTModule } from "./app.aest.module";
import { AppInstitutionsModule } from "./app.institutions.module";
import { ClientTypeBaseRoute } from "./types";
import { AppStudentsModule } from "./app.students.module";
import { AppSystemAccessModule } from "./app.system-access.module";
import { AppSupportingUsersModule } from "./app.supporting-users.module";

@Module({
  imports: [
    LoggerModule,
    DatabaseModule,
    AuthModule,
    CraIntegrationModule,
    MSFAAIntegrationModule,
    SFASIntegrationModule,
    ECertIntegrationModule,
    FedRestrictionIntegrationModule,
    DisbursementReceiptIntegrationModule,
    AppAESTModule,
    AppInstitutionsModule,
    AppStudentsModule,
    AppSystemAccessModule,
    AppSupportingUsersModule,
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
        path: ClientTypeBaseRoute.SupportingUser,
        module: AppSupportingUsersModule,
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
    ProgramYearController,
    ConfigController,
    DynamicFormController,
    EducationProgramController,
    EducationProgramOfferingController,
    ATBCController,
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
    InstitutionUserAuthService,
    EducationProgramService,
    EducationProgramOfferingService,
    ATBCService,
    StudentFileService,
    ProgramYearService,
    SequenceControlService,
    InstitutionTypeService,
    MSFAANumberService,
    StudentRestrictionService,
    RestrictionService,
    InstitutionRestrictionService,
    DesignationAgreementLocationService,
    GCNotifyService,
    GCNotifyActionsService,
  ],
})
export class AppModule {}
