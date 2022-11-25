import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseModule } from "@sims/sims-db";
import { RouterModule } from "@nestjs/core";
import {
  UserService,
  ApplicationService,
  BCeIDServiceProvider,
  InstitutionUserAuthService,
  EducationProgramService,
  EducationProgramOfferingService,
  FormService,
  InstitutionLocationService,
  StudentFileService,
  ProgramYearService,
  InstitutionTypeService,
  MSFAANumberService,
  StudentRestrictionService,
  RestrictionService,
  DesignationAgreementLocationService,
  GCNotifyService,
  GCNotifyActionsService,
  StudentService,
  SFASIndividualService,
  EducationProgramOfferingValidationService,
  NotificationService,
  NotificationMessageService,
} from "./services";
import {
  UserController,
  ProgramYearController,
  ConfigController,
  DynamicFormController,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
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
import {
  ZeebeModule,
  SequenceControlService,
  WorkflowClientService,
} from "@sims/services";
import { LoggerModule } from "@sims/utilities/logger";
import { ConfigModule } from "@sims/utilities/config";
import { IER12IntegrationModule } from "./institution-integration/ier-integration/ier12-integration.module";
import { QueueModule } from "@sims/services/queue";

@Module({
  imports: [
    LoggerModule,
    ConfigModule,
    DatabaseModule,
    AuthModule,
    ZeebeModule.forRoot(),
    CraIntegrationModule,
    MSFAAIntegrationModule,
    SFASIntegrationModule,
    ECertIntegrationModule,
    FedRestrictionIntegrationModule,
    IER12IntegrationModule,
    DisbursementReceiptIntegrationModule,
    AppAESTModule,
    AppInstitutionsModule,
    AppStudentsModule,
    AppSystemAccessModule,
    AppSupportingUsersModule,
    QueueModule,
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
  ],
  providers: [
    AppService,
    UserService,
    BCeIDServiceProvider,
    FormService,
    ApplicationService,
    InstitutionLocationService,
    InstitutionUserAuthService,
    EducationProgramService,
    EducationProgramOfferingService,
    StudentFileService,
    ProgramYearService,
    SequenceControlService,
    InstitutionTypeService,
    MSFAANumberService,
    StudentRestrictionService,
    RestrictionService,
    DesignationAgreementLocationService,
    GCNotifyService,
    GCNotifyActionsService,
    StudentService,
    SFASIndividualService,
    EducationProgramOfferingValidationService,
    NotificationService,
    NotificationMessageService,
    WorkflowClientService,
  ],
})
export class AppModule {}
