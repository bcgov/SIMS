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
import { SupportingUserSupportingUsersController } from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { SFASRestrictionService } from "@sims/integrations/services/sfas";

@Module({
  imports: [AuthModule],
  controllers: [SupportingUserSupportingUsersController],
  providers: [
    SupportingUserService,
    ApplicationService,
    UserService,
    FormService,
    SequenceControlService,
    StudentFileService,
    RestrictionService,
    StudentRestrictionService,
    EducationProgramOfferingService,
    StudentService,
    SFASIndividualService,
    SFASRestrictionService,
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
  ],
})
export class AppSupportingUsersModule {}
