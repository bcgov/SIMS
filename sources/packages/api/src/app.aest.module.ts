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
  StudentAppealRequestsService,
  StudentAppealService,
  StudentScholasticStandingsService,
  StudentAssessmentService,
} from "./services";
import {
  AESTSupportingUserController,
  DesignationAgreementAESTController,
  DesignationAgreementControllerService,
  ApplicationAESTController,
  InstitutionAESTController,
  InstitutionControllerService,
  AssessmentAESTController,
  StudentAESTController,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { LoggerModule } from "./logger/logger.module";
import { ApplicationControllerService } from "./route-controllers/application/application.controller.service";

@Module({
  imports: [LoggerModule, DatabaseModule, AuthModule],
  controllers: [
    AESTSupportingUserController,
    DesignationAgreementAESTController,
    ApplicationAESTController,
    InstitutionAESTController,
    AssessmentAESTController,
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
    StudentAppealRequestsService,
    StudentAppealService,
    StudentScholasticStandingsService,
    StudentAssessmentService,
  ],
})
export class AppAESTModule {}
