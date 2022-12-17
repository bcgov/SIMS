import { Module } from "@nestjs/common";
import { SshService } from "@sims/integrations/services";
// todo: review imports. add services to index.
import { FederalRestrictionService } from "@sims/integrations/services/restriction/federal-restriction.service";
import { RestrictionService } from "@sims/integrations/services/restriction/restriction.service";
import { StudentRestrictionService } from "@sims/integrations/services/restriction/student-restriction.service";
import { FedRestrictionIntegrationService } from "./fed-restriction-integration.service";
import { FedRestrictionProcessingService } from "./fed-restriction-processing.service";

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
