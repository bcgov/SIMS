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
  InstitutionUserAuthService,
  EducationProgramService,
  EducationProgramOfferingService,
  WorkflowActionsService,
  WorkflowService,
  FormService,
  InstitutionLocationService,
  FormsFlowService,
  KeycloakService,
  TokensService,
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
  CRAIntegrationController,
  EducationProgramController,
  EducationProgramOfferingController,
  ApplicationSystemController,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { LoggerModule } from "./logger/logger.module";
import { CraIntegrationModule } from "./cra-integration/cra-integration.module";
// Test
@Module({
  imports: [LoggerModule, DatabaseModule, AuthModule, CraIntegrationModule],
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
    CRAIntegrationController,
    EducationProgramController,
    EducationProgramOfferingController,
    ApplicationSystemController,
  ],
  providers: [
    AppService,
    UserService,
    StudentService,
    InstitutionService,
    ConfigService,
    ArchiveDbService,
    BCeIDServiceProvider,
    TokensService,
    WorkflowService,
    WorkflowActionsService,
    FormService,
    ApplicationService,
    InstitutionLocationService,
    FormsFlowService,
    KeycloakService,
    InstitutionUserAuthService,
    EducationProgramService,
    EducationProgramOfferingService,
  ],
})
export class AppModule {}
