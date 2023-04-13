import { Global, Module } from "@nestjs/common";
import {
  RestrictionSharedService,
  StudentRestrictionSharedService,
  WorkflowClientService,
} from "@sims/services";
import { ConfigModule } from "@sims/utilities/config";
import {
  DisbursementScheduleService,
  SshService,
} from "@sims/integrations/services";
import { ECEProcessingService } from "./ece.processing.service";
import { ECEIntegrationService } from "./ece.integration.service";

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
  ],
  exports: [ECEProcessingService],
})
export class ECEIntegrationModule {}
