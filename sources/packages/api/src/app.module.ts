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
  InstitutionLocationsController,
  CraIntegrationController,
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
  SshService,
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
    CraIntegrationController,
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
    FormsFlowService,
    KeycloakService,
    SshService,
  ],
})
export class AppModule {}
