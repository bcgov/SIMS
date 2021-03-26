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
} from "./services";
import {
  UserController,
  StudentController,
  InstitutionController,
  ConfigController,
  DynamicFormController,
  WorkflowController,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { LoggerModule } from "./logger/logger.module";
import { RuleEngineService } from "./services/rule-engine/rule-engine.service";
import { FormService } from "./services/form/form.service";
import { ServiceAccountService } from "./services/service-account/service-account.service";
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
  ],
})
export class AppModule {}
