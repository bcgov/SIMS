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
  EducationProgramOfferingValidationService,
} from "./services";
import {
  ApplicationControllerService,
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
  ConfirmationOfEnrollmentControllerService,
  StudentInstitutionsController,
  OverawardInstitutionsController,
  StudentControllerService,
  OverawardControllerService,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import {
  ConfirmationOfEnrollmentService,
  DisbursementOverawardService,
  SequenceControlService,
  StudentRestrictionSharedService,
  WorkflowClientService,
  NoteSharedService,
  RestrictionSharedService,
  DisbursementScheduleSharedService,
} from "@sims/services";
import {
  SFASIndividualService,
  SFASApplicationService,
  SFASPartTimeApplicationsService,
} from "@sims/services/sfas";
import { UserInstitutionsController } from "./route-controllers/user/user.institutions.controller";
import { UserControllerService } from "./route-controllers/user/user.controller.service";
import { ApplicationInstitutionsController } from "./route-controllers/application/application.institutions.controller";

@Module({
  imports: [AuthModule],
  controllers: [
    DesignationAgreementInstitutionsController,
    InstitutionInstitutionsController,
    InstitutionUserInstitutionsController,
    InstitutionLocationInstitutionsController,
    ApplicationInstitutionsController,
    ScholasticStandingInstitutionsController,
    ConfirmationOfEnrollmentInstitutionsController,
    EducationProgramInstitutionsController,
    ProgramInfoRequestInstitutionsController,
    EducationProgramOfferingInstitutionsController,
    UserInstitutionsController,
    StudentInstitutionsController,
    OverawardInstitutionsController,
  ],
  providers: [
    ApplicationControllerService,
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
    StudentRestrictionSharedService,
    UserControllerService,
    ConfirmationOfEnrollmentControllerService,
    ConfirmationOfEnrollmentService,
    DisbursementOverawardService,
    NoteSharedService,
    StudentControllerService,
    RestrictionSharedService,
    OverawardControllerService,
    DisbursementScheduleSharedService,
  ],
})
export class AppInstitutionsModule {}
