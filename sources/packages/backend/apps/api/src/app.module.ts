import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { APP_INTERCEPTOR, RouterModule } from "@nestjs/core";
import {
  UserService,
  BCeIDServiceProvider,
  FormService,
  ProgramYearService,
  AuditService,
} from "./services";
import {
  AuditController,
  ConfigController,
  DynamicFormController,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { AppAESTModule } from "./app.aest.module";
import { AppInstitutionsModule } from "./app.institutions.module";
import { ClientTypeBaseRoute } from "./types";
import { AppStudentsModule } from "./app.students.module";
import { AppSupportingUsersModule } from "./app.supporting-users.module";
import {
  ClamAntivirusModule,
  GlobalHttpModule,
  ZeebeModule,
} from "@sims/services";
import { LoggerModule } from "@sims/utilities/logger";
import { ConfigModule } from "@sims/utilities/config";
import { DatabaseModule } from "@sims/sims-db";
import { NotificationsModule } from "@sims/services/notifications";
import { QueueModule } from "@sims/services/queue";
import { AppExternalModule } from "./app.external.module";
import { AccessLoggingInterceptor } from "apps/api/src/interceptors";

@Module({
  imports: [
    GlobalHttpModule,
    DatabaseModule,
    LoggerModule,
    ConfigModule,
    AuthModule,
    ZeebeModule.forRoot(),
    NotificationsModule,
    AppAESTModule,
    AppInstitutionsModule,
    AppStudentsModule,
    AppExternalModule,
    AppSupportingUsersModule,
    QueueModule,
    ClamAntivirusModule,
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
        path: ClientTypeBaseRoute.External,
        module: AppExternalModule,
      },
    ]),
  ],
  controllers: [
    AppController,
    ConfigController,
    DynamicFormController,
    AuditController,
  ],
  providers: [
    AuditService,
    AppService,
    UserService,
    BCeIDServiceProvider,
    FormService,
    ProgramYearService,
    { provide: APP_INTERCEPTOR, useClass: AccessLoggingInterceptor },
  ],
})
export class AppModule {}
