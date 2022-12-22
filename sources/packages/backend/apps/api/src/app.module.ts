import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
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
  StudentRestrictionService,
  RestrictionService,
  DesignationAgreementLocationService,
  StudentService,
  SFASIndividualService,
  EducationProgramOfferingValidationService,
} from "./services";
import {
  UserController,
  ProgramYearStudentsController,
  ConfigController,
  DynamicFormController,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { SFASIntegrationModule } from "./sfas-integration/sfas-integration.module";
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
import { DatabaseModule } from "@sims/sims-db";
import { NotificationsModule } from "@sims/services/notifications";
import {
  DisbursementReceiptIntegrationModule,
  ECertIntegrationModule,
  FedRestrictionIntegrationModule,
  MSFAAIntegrationModule,
} from "@sims/integrations/esdc-integration";
import { QueueModule } from "@sims/services/queue";
import { MSFAANumberService } from "@sims/integrations/services";

@Module({
  imports: [
    DatabaseModule,
    LoggerModule,
    ConfigModule,
    AuthModule,
    ZeebeModule.forRoot(),
    NotificationsModule,
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
    ProgramYearStudentsController,
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
    StudentService,
    SFASIndividualService,
    EducationProgramOfferingValidationService,
    WorkflowClientService,
  ],
})
export class AppModule {}
