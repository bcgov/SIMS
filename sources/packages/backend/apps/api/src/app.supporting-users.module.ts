import { Module } from "@nestjs/common";
import { DatabaseModule } from "@sims/sims-db";
import {
  ApplicationService,
  FormService,
  MSFAANumberService,
  SFASApplicationService,
  SFASPartTimeApplicationsService,
  StudentFileService,
  SupportingUserService,
  UserService,
  GCNotifyService,
  GCNotifyActionsService,
  StudentRestrictionService,
  RestrictionService,
  EducationProgramOfferingService,
  StudentService,
  SFASIndividualService,
  EducationProgramOfferingValidationService,
  NotificationService,
  NotificationMessageService,
} from "./services";
import { SequenceControlService, WorkflowClientService } from "@sims/services";
import { SupportingUserSupportingUsersController } from "./route-controllers";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [DatabaseModule, AuthModule],
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
    GCNotifyService,
    GCNotifyActionsService,
    RestrictionService,
    StudentRestrictionService,
    EducationProgramOfferingService,
    StudentService,
    SFASIndividualService,
    EducationProgramOfferingValidationService,
    WorkflowClientService,
    NotificationService,
    NotificationMessageService,
  ],
})
export class AppSupportingUsersModule {}
