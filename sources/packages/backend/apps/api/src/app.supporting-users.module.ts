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
} from "./services";
import {
  SequenceControlService,
  StudentRestrictionSharedService,
  WorkflowClientService,
} from "@sims/services";
import {
  SFASIndividualService,
  SFASApplicationService,
  SFASPartTimeApplicationsService,
} from "@sims/services/sfas";
import { SupportingUserSupportingUsersController } from "./route-controllers";
import { AuthModule } from "./auth/auth.module";

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
    SFASApplicationService,
    SFASPartTimeApplicationsService,
    EducationProgramOfferingValidationService,
    WorkflowClientService,
    StudentRestrictionSharedService,
  ],
})
export class AppSupportingUsersModule {}
