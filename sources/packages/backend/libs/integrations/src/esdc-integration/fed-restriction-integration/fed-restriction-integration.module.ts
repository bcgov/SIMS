import { Module } from "@nestjs/common";
import {
  FederalRestrictionService,
  RestrictionService,
  SshService,
  StudentRestrictionService,
} from "@sims/integrations/services";
import { FedRestrictionIntegrationService } from "./fed-restriction-integration.service";
import { FedRestrictionProcessingService } from "./fed-restriction-processing.service";
// todo: review imports. add services to index.

@Module({
  providers: [
    SshService,
    FedRestrictionIntegrationService,
    FedRestrictionProcessingService,
    RestrictionService,
    // StudentService,
    StudentRestrictionService,
    // SFASIndividualService,
    FederalRestrictionService,
  ],
  exports: [FedRestrictionIntegrationService, FedRestrictionProcessingService],
})
export class FedRestrictionIntegrationModule {}
