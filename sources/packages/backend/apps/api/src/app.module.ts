import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { AppService } from "./app.service";
import { RouterModule } from "@nestjs/core";
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
  DynamicFormAESTController,
  HealthController,
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
import { AccessLoggerMiddleware } from "./middlewares";
import { TerminusModule } from "@nestjs/terminus";
import { DynamicFormConfigurationModule } from "./dynamic-form-configuration.module";
import { json } from "express";
import { JSON_200KB } from "./constants";

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
    TerminusModule,
    DynamicFormConfigurationModule,
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
    HealthController,
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
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AccessLoggerMiddleware).exclude("health").forRoutes("*");
    // Allow the configuration of the body parser for individual routes.
    consumer
      .apply(json({ limit: JSON_200KB }))
      .forRoutes(DynamicFormAESTController);
    // Apply the body parser global configuration after the specific ones to allow the proper evaluation of the routes.
    consumer.apply(json()).forRoutes("*");
  }
}
