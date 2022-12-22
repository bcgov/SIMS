import { Module } from "@nestjs/common";
import {
  FederalRestrictionService,
  IntegrationRestrictionService,
  SshService,
  IntegrationStudentRestrictionService,
} from "@sims/integrations/services";
import { FedRestrictionIntegrationService } from "./fed-restriction-integration.service";
import { FedRestrictionProcessingService } from "./fed-restriction-processing.service";

@Module({
  providers: [
    SshService,
    FedRestrictionIntegrationService,
    FedRestrictionProcessingService,
    IntegrationRestrictionService,
    IntegrationStudentRestrictionService,
    FederalRestrictionService,
  ],
  exports: [FedRestrictionIntegrationService, FedRestrictionProcessingService],
})
export class FedRestrictionIntegrationModule {}
