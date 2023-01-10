import { Global, Module } from "@nestjs/common";
import {
  StudentRestrictionSharedService,
  WorkflowClientService,
} from "@sims/services";
import { ConfigModule } from "@sims/utilities/config";
import {
  DisbursementScheduleService,
  SshService,
} from "@sims/integrations/services";
import { ECEFileService } from "./ece.processing.service";
import { ECEIntegrationService } from "./ece.integration.service";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    SshService,
    DisbursementScheduleService,
    ECEFileService,
    WorkflowClientService,
    ECEIntegrationService,
    StudentRestrictionSharedService,
  ],
  exports: [ECEFileService],
})
export class ECEIntegrationModule {}
