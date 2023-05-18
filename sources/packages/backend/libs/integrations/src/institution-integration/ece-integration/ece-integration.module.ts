import { Global, Module } from "@nestjs/common";
import {
  RestrictionSharedService,
  StudentRestrictionSharedService,
  WorkflowClientService,
} from "@sims/services";
import { ConfigModule } from "@sims/utilities/config";
import {
  DisbursementScheduleService,
  InstitutionLocationService,
  SshService,
} from "@sims/integrations/services";
import { ECEProcessingService } from "./ece.processing.service";
import { ECEIntegrationService } from "./ece.integration.service";
import { ECEResponseIntegrationService } from "./ece-response.integration.service";
import { ECEResponseProcessingService } from "./ece-response.processing.service";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    SshService,
    DisbursementScheduleService,
    ECEProcessingService,
    WorkflowClientService,
    ECEIntegrationService,
    StudentRestrictionSharedService,
    RestrictionSharedService,
    ECEResponseIntegrationService,
    ECEResponseProcessingService,
    InstitutionLocationService,
  ],
  exports: [ECEProcessingService, ECEResponseProcessingService],
})
export class ECEIntegrationModule {}
