import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import {
  ApplicationService,
  ConfigService,
  FormService,
  MSFAANumberService,
  SequenceControlService,
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
} from "./services";
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
  ],
})
export class AppSupportingUsersModule {}
