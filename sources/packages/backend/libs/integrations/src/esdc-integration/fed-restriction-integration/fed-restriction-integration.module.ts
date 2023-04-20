import { Module } from "@nestjs/common";
import {
  FederalRestrictionService,
  RestrictionService,
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
    SshService,
    FedRestrictionIntegrationService,
    FedRestrictionProcessingService,
    RestrictionService,
    RestrictionSharedService,
    StudentRestrictionSharedService,
    FederalRestrictionService,
  ],
  exports: [FedRestrictionProcessingService],
})
export class FedRestrictionIntegrationModule {}
