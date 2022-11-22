import { Module } from "@nestjs/common";
import { NotificationsModule } from "@sims/services/notifications";
import { ConfigModule } from "@sims/utilities/config";
import { AuthModule } from "../../auth/auth.module";
import {
  FederalRestrictionService,
  RestrictionService,
  SFASIndividualService,
  SshService,
  StudentRestrictionService,
  StudentService,
} from "../../services";
import { FedRestrictionIntegrationService } from "./fed-restriction-integration.service";
import { FedRestrictionProcessingService } from "./fed-restriction-processing.service";

@Module({
  imports: [AuthModule, ConfigModule, NotificationsModule],
  providers: [
    SshService,
    FedRestrictionIntegrationService,
    FedRestrictionProcessingService,
    RestrictionService,
    StudentService,
    StudentRestrictionService,
    SFASIndividualService,
    FederalRestrictionService,
  ],
  exports: [FedRestrictionIntegrationService, FedRestrictionProcessingService],
})
export class FedRestrictionIntegrationModule {}
