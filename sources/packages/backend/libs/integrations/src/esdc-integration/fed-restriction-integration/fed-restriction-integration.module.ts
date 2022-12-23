import { Module } from "@nestjs/common";
import {
  FederalRestrictionService,
  IntegrationRestrictionService,
  SshService,
  StudentRestrictionsService,
} from "@sims/integrations/services";
import { FedRestrictionIntegrationService } from "./fed-restriction-integration.service";
import { FedRestrictionProcessingService } from "./fed-restriction-processing.service";

@Module({
  providers: [
    SshService,
    FedRestrictionIntegrationService,
    FedRestrictionProcessingService,
    IntegrationRestrictionService,
    StudentRestrictionsService,
    FederalRestrictionService,
  ],
  exports: [
    FedRestrictionIntegrationService,
    FedRestrictionProcessingService,
    FederalRestrictionService,
    IntegrationRestrictionService,
  ],
})
export class FedRestrictionIntegrationModule {}
