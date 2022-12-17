import { Module } from "@nestjs/common";
import {
  ApplicationService,
  StudentFileService,
  SupportingUserService,
  TokensService,
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
  StudentAssessmentService,
  SFASApplicationService,
  SFASPartTimeApplicationsService,
  StudentService,
  SFASIndividualService,
  StudentRestrictionService,
  RestrictionService,
  ApplicationExceptionService,
  StudentScholasticStandingsService,
  SINValidationService,
  InstitutionUserAuthService,
  InstitutionTypeService,
  StudentAccountApplicationsService,
  InstitutionRestrictionService,
  EducationProgramOfferingValidationService,
  DisbursementReceiptService,
} from "./services";
import {
  SupportingUserAESTController,
  DesignationAgreementAESTController,
  DesignationAgreementControllerService,
  ApplicationAESTController,
  InstitutionAESTController,
  InstitutionControllerService,
  AssessmentAESTController,
  StudentAESTController,
  StudentAppealAESTController,
  InstitutionLocationAESTController,
  InstitutionLocationControllerService,
  AssessmentControllerService,
  EducationProgramOfferingAESTController,
  ReportAESTController,
  StudentControllerService,
  ApplicationExceptionAESTController,
  ScholasticStandingAESTController,
  ScholasticStandingControllerService,
  InstitutionUserAESTController,
  EducationProgramAESTController,
  EducationProgramControllerService,
  StudentAccountApplicationAESTController,
  EducationProgramOfferingControllerService,
  NoteAESTController,
  RestrictionAESTController,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { ApplicationControllerService } from "./route-controllers/application/application.controller.service";
import { InstitutionUserControllerService } from "./route-controllers/institution-user/institution-user.controller.service";
import { WorkflowClientService, SequenceControlService } from "@sims/services";
import { ReportService } from "@sims/integrations/services/report/report.service";
import { MSFAANumberService } from "@sims/integrations/services/msfaa-number/msfaa-number.service";
import { StudentRestrictionService as StudentRestrictionsService } from "@sims/integrations/services/restriction/student-restriction.service";

@Module({
  imports: [AuthModule],
  controllers: [
    SupportingUserAESTController,
    DesignationAgreementAESTController,
    ApplicationAESTController,
    InstitutionAESTController,
    InstitutionUserAESTController,
    AssessmentAESTController,
    StudentAESTController,
    StudentAppealAESTController,
    InstitutionLocationAESTController,
    EducationProgramOfferingAESTController,
    ReportAESTController,
    ApplicationExceptionAESTController,
    ScholasticStandingAESTController,
    EducationProgramAESTController,
    StudentAccountApplicationAESTController,
    NoteAESTController,
    RestrictionAESTController,
  ],
  providers: [
    WorkflowClientService,
    InstitutionRestrictionService,
    SupportingUserService,
    ApplicationService,
    SequenceControlService,
    StudentFileService,
    MSFAANumberService,
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
    StudentAssessmentService,
    SFASApplicationService,
    SFASPartTimeApplicationsService,
    InstitutionLocationControllerService,
    AssessmentControllerService,
    ReportService,
    StudentControllerService,
    StudentService,
    SFASIndividualService,
    StudentRestrictionService,
    RestrictionService,
    ApplicationExceptionService,
    StudentScholasticStandingsService,
    ScholasticStandingControllerService,
    SINValidationService,
    InstitutionUserAuthService,
    InstitutionUserControllerService,
    InstitutionTypeService,
    EducationProgramControllerService,
    StudentAccountApplicationsService,
    EducationProgramOfferingControllerService,
    EducationProgramOfferingValidationService,
    DisbursementReceiptService,
    // todo: ann review the StudentRestrictionsService
    StudentRestrictionsService,
  ],
})
export class AppAESTModule {}
