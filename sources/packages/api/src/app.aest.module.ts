import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import {
  ApplicationService,
  ConfigService,
  MSFAANumberService,
  SequenceControlService,
  StudentFileService,
  SupportingUserService,
  TokensService,
  WorkflowActionsService,
  WorkflowService,
  DesignationAgreementService,
  FormService,
  InstitutionLocationService,
  DesignationAgreementLocationService,
  EducationProgramOfferingService,
  EducationProgramService,
  InstitutionService,
  BCeIDService,
  UserService,
} from "./services";
import {
  AESTSupportingUserController,
  DesignationAgreementAESTController,
  DesignationAgreementControllerService,
  ApplicationAESTController,
  InstitutionAESTController,
  InstitutionControllerService,
  StudentAESTController,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { LoggerModule } from "./logger/logger.module";
import { ApplicationControllerService } from "./route-controllers/application/application.controller.service";
import { InstitutionLocationsControllerService } from "./route-controllers/institution-locations/institution-locations.controller.service";

@Module({
  imports: [LoggerModule, DatabaseModule, AuthModule],
  controllers: [
    AESTSupportingUserController,
    DesignationAgreementAESTController,
    ApplicationAESTController,
    InstitutionAESTController,
    StudentAESTController,
  ],
  providers: [
    SupportingUserService,
    ApplicationService,
    SequenceControlService,
    StudentFileService,
    WorkflowActionsService,
    MSFAANumberService,
    WorkflowService,
    ConfigService,
    TokensService,
    DesignationAgreementService,
    DesignationAgreementControllerService,
    FormService,
    InstitutionLocationService,
    DesignationAgreementLocationService,
    EducationProgramOfferingService,
    EducationProgramService,
    InstitutionService,
    BCeIDService,
    UserService,
    InstitutionControllerService,
    ApplicationControllerService,
    InstitutionLocationsControllerService,
  ],
})
export class AppAESTModule {}
