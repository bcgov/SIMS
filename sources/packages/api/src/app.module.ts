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
  BCeIDService,
  ApplicationService,
} from "./services";
import {
  UserController,
  StudentController,
  InstitutionController,
  ConfigController,
  DynamicFormController,
  WorkflowController,
  ApplicationController,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { LoggerModule } from "./logger/logger.module";
import { RuleEngineService } from "./services/rule-engine/rule-engine.service";
import { FormService } from "./services/form/form.service";
import { ServiceAccountService } from "./services/service-account/service-account.service";
import { InstitutionLocationService } from "./services/institution-location/institution-location.service";
@Module({
  imports: [LoggerModule, DatabaseModule, AuthModule],
  controllers: [
    AppController,
    UserController,
    StudentController,
    InstitutionController,
    ConfigController,
    DynamicFormController,
    WorkflowController,
    ApplicationController,
  ],
  providers: [
    AppService,
    UserService,
    StudentService,
    InstitutionService,
    ConfigService,
    ArchiveDbService,
    BCeIDService,
    ServiceAccountService,
    RuleEngineService,
    FormService,
    ApplicationService,
    InstitutionLocationService,
  ],
})
export class AppModule {}
