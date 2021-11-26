import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { ConfigService, SshService } from "../../services";
import { FedRestrictionIntegrationService } from "./fed-restriction-integration.service";
import { FedRestrictionProcessingService } from "./fed-restriction-processing.service";

@Module({
  imports: [AuthModule],
  providers: [
    SshService,
    FedRestrictionIntegrationService,
    FedRestrictionProcessingService,
    ConfigService,
  ],
  exports: [FedRestrictionIntegrationService, FedRestrictionProcessingService],
})
export class FedRestrictionIntegrationModule {}
