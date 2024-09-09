import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { RouterModule } from "@nestjs/core";
import {
  UserService,
  BCeIDServiceProvider,
  FormService,
  ProgramYearService,
  AnnouncementService,
} from "./services";
import {
  AnnouncementController,
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
    ]),
  ],
  controllers: [
    AppController,
    ConfigController,
    DynamicFormController,
    AnnouncementController,
  ],
  providers: [
    AppService,
    UserService,
    BCeIDServiceProvider,
    FormService,
    AnnouncementService,
    ProgramYearService,
  ],
})
export class AppModule {}
