import { Global, Module } from "@nestjs/common";
import { WorkflowClientService } from "@sims/services";
import { ConfigModule } from "@sims/utilities/config";
import {
  StudentAssessmentService,
  SshService,
} from "@sims/integrations/services";
import { ECEFileService } from "./ece-file.service";
import { ECEIntegrationService } from "./ece-integration.service";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    SshService,
    StudentAssessmentService,
    ECEFileService,
    WorkflowClientService,
    ECEIntegrationService,
  ],
  exports: [ECEFileService, ECEIntegrationService],
})
export class ECEIntegrationModule {}
