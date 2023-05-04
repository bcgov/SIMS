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
  RestrictionInstitutionController,
  OverawardControllerService,
  RestrictionControllerService,
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
} from "@sims/services";
import {
  SFASIndividualService,
  SFASApplicationService,
  SFASPartTimeApplicationsService,
} from "@sims/services/sfas";
import { UserInstitutionsController } from "./route-controllers/user/user.institutions.controller";
import { UserControllerService } from "./route-controllers/user/user.controller.service";

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
    UserInstitutionsController,
    StudentInstitutionsController,
    RestrictionInstitutionController,
    OverawardInstitutionsController,
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
    StudentRestrictionService,
    RestrictionService,
    RestrictionControllerService,
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
  ],
})
export class AppInstitutionsModule {}
