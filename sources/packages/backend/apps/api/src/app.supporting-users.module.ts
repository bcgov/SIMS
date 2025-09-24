import { Module } from "@nestjs/common";
import {
  ApplicationService,
  FormService,
  StudentFileService,
  SupportingUserService,
  UserService,
  StudentRestrictionService,
  RestrictionService,
  EducationProgramOfferingService,
  StudentService,
  EducationProgramOfferingValidationService,
  InstitutionLocationService,
  DesignationAgreementLocationService,
  EducationProgramService,
  InstitutionService,
  BCeIDService,
  InstitutionUserAuthService,
  ApplicationRestrictionBypassService,
} from "./services";
import {
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
import {
  SupportingUserControllerService,
  SupportingUserSupportingUsersController,
} from "./route-controllers";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [SupportingUserSupportingUsersController],
  providers: [
    SupportingUserService,
    ApplicationService,
    InstitutionService,
    InstitutionUserAuthService,
    BCeIDService,
    UserService,
    FormService,
    SequenceControlService,
    StudentFileService,
    RestrictionService,
    StudentRestrictionService,
    ApplicationRestrictionBypassService,
    EducationProgramOfferingService,
    EducationProgramService,
    StudentService,
    SFASIndividualService,
    SFASApplicationService,
    SFASPartTimeApplicationsService,
    EducationProgramOfferingValidationService,
    WorkflowClientService,
    StudentRestrictionSharedService,
    RestrictionSharedService,
    DisbursementOverawardService,
    NoteSharedService,
    InstitutionLocationService,
    DesignationAgreementLocationService,
    SupportingUserControllerService,
  ],
})
export class AppSupportingUsersModule {}
