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
} from "./services";
import {
  AESTSupportingUserController,
  DesignationAgreementAESTController,
  DesignationAgreementControllerService,
  ApplicationAESTController,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { LoggerModule } from "./logger/logger.module";

@Module({
  imports: [LoggerModule, DatabaseModule, AuthModule],
  controllers: [
    AESTSupportingUserController,
    DesignationAgreementAESTController,
    ApplicationAESTController,
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
  ],
})
export class AppAESTModule {}
