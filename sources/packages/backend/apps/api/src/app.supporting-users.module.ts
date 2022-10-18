import { Module } from "@nestjs/common";
import { DatabaseModule } from "@sims/sims-db";
import {
  ApplicationService,
  ConfigService,
  FormService,
  MSFAANumberService,
  SFASApplicationService,
  SFASPartTimeApplicationsService,
  StudentFileService,
  SupportingUserService,
  UserService,
  WorkflowActionsService,
  WorkflowService,
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
import { LoggerModule } from "./logger/logger.module";

@Module({
  imports: [LoggerModule, DatabaseModule, AuthModule],
  controllers: [SupportingUserSupportingUsersController],
  providers: [
    SupportingUserService,
    ApplicationService,
    UserService,
    FormService,
    WorkflowActionsService,
    SequenceControlService,
    StudentFileService,
    WorkflowActionsService,
    MSFAANumberService,
    ConfigService,
    WorkflowService,
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
