import { Module } from "@nestjs/common";
import {
  ApplicationService,
  FormService,
  SFASApplicationService,
  SFASPartTimeApplicationsService,
  StudentFileService,
  SupportingUserService,
  UserService,
  StudentRestrictionService,
  RestrictionService,
  EducationProgramOfferingService,
  StudentService,
  SFASIndividualService,
  EducationProgramOfferingValidationService,
} from "./services";
import { SequenceControlService, WorkflowClientService } from "@sims/services";
import { SupportingUserSupportingUsersController } from "./route-controllers";
import { AuthModule } from "./auth/auth.module";
import { MSFAANumberService } from "@sims/integrations/services/msfaa-number/msfaa-number.service";
import { StudentRestrictionService as StudentRestrictionsService } from "@sims/integrations/services/restriction/student-restriction.service";

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
    SFASApplicationService,
    SFASPartTimeApplicationsService,
    RestrictionService,
    StudentRestrictionService,
    EducationProgramOfferingService,
    StudentService,
    SFASIndividualService,
    EducationProgramOfferingValidationService,
    WorkflowClientService,
    // todo: ann review the StudentRestrictionsService
    StudentRestrictionsService,
  ],
})
export class AppSupportingUsersModule {}
