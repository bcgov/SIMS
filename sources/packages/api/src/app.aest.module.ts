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
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { LoggerModule } from "./logger/logger.module";

@Module({
  imports: [LoggerModule, DatabaseModule, AuthModule],
  controllers: [
    AESTSupportingUserController,
    DesignationAgreementAESTController,
    ApplicationAESTController,
    InstitutionAESTController,
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
  ],
})
export class AppAESTModule {}
