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
  ApplicationService,
  BCeIDServiceProvider,
} from "./services";
import {
  UserController,
  StudentController,
  InstitutionController,
  ConfigController,
  DynamicFormController,
  WorkflowController,
  ApplicationController,
  InstitutionLocationsController,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { LoggerModule } from "./logger/logger.module";
import {
  RuleEngineService,
  FormService,
  ServiceAccountService,
  InstitutionLocationService,
  FormsFlowService,
  KeycloakService,
} from "./services";

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
    InstitutionLocationsController,
  ],
  providers: [
    AppService,
    UserService,
    StudentService,
    InstitutionService,
    ConfigService,
    ArchiveDbService,
    BCeIDServiceProvider,
    ServiceAccountService,
    RuleEngineService,
    FormService,
    ApplicationService,
    InstitutionLocationService,
    FormsFlowService,
    KeycloakService,
  ],
})
export class AppModule {}
