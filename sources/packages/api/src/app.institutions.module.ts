import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import {
  ConfigService,
  DesignationAgreementService,
  FormService,
  InstitutionService,
  BCeIDService,
  UserService,
  InstitutionLocationService,
  DesignationAgreementLocationService,
  ApplicationService,
  SequenceControlService,
  StudentFileService,
  WorkflowActionsService,
  MSFAANumberService,
  WorkflowService,
  SFASApplicationService,
  SFASPartTimeApplicationsService,
  StudentScholasticStandingsService,
  StudentAssessmentService,
  GcNotifyService,
  GcNotifyActionsService,
} from "./services";
import {
  DesignationAgreementInstitutionsController,
  DesignationAgreementControllerService,
  InstitutionInstitutionsController,
  InstitutionControllerService,
  InstitutionLocationInstitutionsController,
  InstitutionLocationControllerService,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { LoggerModule } from "./logger/logger.module";

@Module({
  imports: [LoggerModule, DatabaseModule, AuthModule],
  controllers: [
    DesignationAgreementInstitutionsController,
    InstitutionInstitutionsController,
    InstitutionLocationInstitutionsController,
  ],
  providers: [
    FormService,
    ConfigService,
    DesignationAgreementService,
    DesignationAgreementControllerService,
    InstitutionService,
    BCeIDService,
    UserService,
    InstitutionLocationService,
    InstitutionControllerService,
    DesignationAgreementLocationService,
    InstitutionLocationControllerService,
    ApplicationService,
    SequenceControlService,
    StudentFileService,
    WorkflowActionsService,
    MSFAANumberService,
    WorkflowService,
    SFASApplicationService,
    SFASPartTimeApplicationsService,
    StudentScholasticStandingsService,
    StudentAssessmentService,
    GcNotifyService,
    GcNotifyActionsService,
  ],
})
export class AppInstitutionsModule {}
