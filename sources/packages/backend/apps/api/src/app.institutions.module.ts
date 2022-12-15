import { Module } from "@nestjs/common";
import {
  DesignationAgreementService,
  FormService,
  InstitutionService,
  BCeIDService,
  UserService,
  InstitutionLocationService,
  DesignationAgreementLocationService,
  ApplicationService,
  StudentFileService,
  MSFAANumberService,
  StudentRestrictionService,
  RestrictionService,
  StudentScholasticStandingsService,
  StudentAssessmentService,
  InstitutionUserAuthService,
  DisbursementScheduleService,
  COEDeniedReasonService,
  InstitutionTypeService,
  EducationProgramOfferingService,
  EducationProgramService,
  PIRDeniedReasonService,
  StudentService,
  EducationProgramOfferingImportCSVService,
} from "./services";
import {
  DesignationAgreementInstitutionsController,
  DesignationAgreementControllerService,
  InstitutionInstitutionsController,
  InstitutionControllerService,
  InstitutionLocationInstitutionsController,
  InstitutionLocationControllerService,
  ScholasticStandingInstitutionsController,
  ScholasticStandingControllerService,
  InstitutionUserInstitutionsController,
  InstitutionUserControllerService,
  ConfirmationOfEnrollmentInstitutionsController,
  ProgramInfoRequestInstitutionsController,
  EducationProgramInstitutionsController,
  EducationProgramControllerService,
  EducationProgramOfferingInstitutionsController,
  EducationProgramOfferingControllerService,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { EducationProgramOfferingValidationService } from "./services/education-program-offering/education-program-offering-validation.service";
import { WorkflowClientService, SequenceControlService } from "@sims/services";
import {
  SFASIndividualService,
  SFASApplicationService,
  SFASPartTimeApplicationsService,
} from "@sims/services/sfas";

@Module({
  imports: [AuthModule],
  controllers: [
    DesignationAgreementInstitutionsController,
    InstitutionInstitutionsController,
    InstitutionUserInstitutionsController,
    InstitutionLocationInstitutionsController,
    ScholasticStandingInstitutionsController,
    ConfirmationOfEnrollmentInstitutionsController,
    EducationProgramInstitutionsController,
    ProgramInfoRequestInstitutionsController,
    EducationProgramOfferingInstitutionsController,
  ],
  providers: [
    WorkflowClientService,
    FormService,
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
    MSFAANumberService,
    StudentRestrictionService,
    RestrictionService,
    StudentScholasticStandingsService,
    StudentAssessmentService,
    ScholasticStandingControllerService,
    InstitutionUserAuthService,
    InstitutionUserControllerService,
    DisbursementScheduleService,
    COEDeniedReasonService,
    InstitutionTypeService,
    EducationProgramService,
    EducationProgramOfferingService,
    EducationProgramOfferingService,
    PIRDeniedReasonService,
    EducationProgramControllerService,
    EducationProgramOfferingControllerService,
    StudentService,
    SFASIndividualService,
    SFASApplicationService,
    SFASPartTimeApplicationsService,
    EducationProgramOfferingImportCSVService,
    EducationProgramOfferingValidationService,
  ],
})
export class AppInstitutionsModule {}
