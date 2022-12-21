import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { RouterModule } from "@nestjs/core";
import {
  UserService,
  BCeIDServiceProvider,
  FormService,
  ProgramYearService,
} from "./services";
import {
  UserController,
  ProgramYearStudentsController,
  ConfigController,
  DynamicFormController,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { MSFAAIntegrationModule } from "./esdc-integration/msfaa-integration/msfaa-integration.module";
import { ECertIntegrationModule } from "./esdc-integration/e-cert-integration/e-cert-integration.module";
import { FedRestrictionIntegrationModule } from "./esdc-integration/fed-restriction-integration/fed-restriction-integration.module";
import { DisbursementReceiptIntegrationModule } from "./esdc-integration/disbursement-receipt-integration/disbursement-receipt-integration.module";
import { AppAESTModule } from "./app.aest.module";
import { AppInstitutionsModule } from "./app.institutions.module";
import { ClientTypeBaseRoute } from "./types";
import { AppStudentsModule } from "./app.students.module";
import { AppSystemAccessModule } from "./app.system-access.module";
import { AppSupportingUsersModule } from "./app.supporting-users.module";
import { ZeebeModule } from "@sims/services";
import { LoggerModule } from "@sims/utilities/logger";
import { ConfigModule } from "@sims/utilities/config";
import { NotificationsModule } from "@sims/services/notifications";
import { QueueModule } from "@sims/services/queue";
import { DatabaseModule } from "@sims/sims-db";

@Module({
  imports: [
    DatabaseModule,
    LoggerModule,
    ConfigModule,
    AuthModule,
    ZeebeModule.forRoot(),
    NotificationsModule,
    MSFAAIntegrationModule,
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
    ProgramYearService,
  ],
})
export class AppModule {}
