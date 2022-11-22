import { Module } from "@nestjs/common";
import { ConfigModule } from "@sims/utilities/config";
import { AuthModule } from "../../auth/auth.module";
import {
  FederalRestrictionService,
  GCNotifyActionsService,
  GCNotifyService,
  NotificationMessageService,
  NotificationService,
  RestrictionService,
  SFASIndividualService,
  SshService,
  StudentRestrictionService,
  StudentService,
} from "../../services";
import { FedRestrictionIntegrationService } from "./fed-restriction-integration.service";
import { FedRestrictionProcessingService } from "./fed-restriction-processing.service";

@Module({
  imports: [AuthModule, ConfigModule],
  providers: [
    SshService,
    FedRestrictionIntegrationService,
    FedRestrictionProcessingService,
    RestrictionService,
    StudentService,
    StudentRestrictionService,
    SFASIndividualService,
    FederalRestrictionService,
    GCNotifyActionsService,
    GCNotifyService,
    NotificationService,
    NotificationMessageService,
  ],
  exports: [FedRestrictionIntegrationService, FedRestrictionProcessingService],
})
export class FedRestrictionIntegrationModule {}
