import { Module } from "@nestjs/common";
import {
  RestrictionService,
  FederalRestrictionService,
  SshService,
} from "@sims/integrations/services";
import {
  RestrictionSharedService,
  StudentRestrictionSharedService,
} from "@sims/services";
import { FedRestrictionIntegrationService } from "./fed-restriction.integration.service";
import { FedRestrictionProcessingService } from "./fed-restriction.processing.service";

@Module({
  providers: [
    FederalRestrictionService,
    SshService,
    FedRestrictionIntegrationService,
    FedRestrictionProcessingService,
    RestrictionService,
    RestrictionSharedService,
    StudentRestrictionSharedService,
  ],
  exports: [FedRestrictionProcessingService],
})
export class FedRestrictionIntegrationModule {}
