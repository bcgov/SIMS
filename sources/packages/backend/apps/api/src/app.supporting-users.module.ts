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
  StudentRestrictionsService,
  WorkflowClientService,
} from "@sims/services";
import {
  SFASIndividualService,
  SFASApplicationService,
  SFASPartTimeApplicationsService,
} from "@sims/services/sfas";
import { SupportingUserSupportingUsersController } from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { MSFAANumberService } from "@sims/integrations/services";

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
    MSFAANumberService,
    RestrictionService,
    StudentRestrictionService,
    EducationProgramOfferingService,
    StudentService,
    SFASIndividualService,
    SFASApplicationService,
    SFASPartTimeApplicationsService,
    EducationProgramOfferingValidationService,
    WorkflowClientService,
    StudentRestrictionsService,
  ],
})
export class AppSupportingUsersModule {}
