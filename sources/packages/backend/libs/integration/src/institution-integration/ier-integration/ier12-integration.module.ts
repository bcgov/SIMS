import { Global, Module } from "@nestjs/common";
import { WorkflowClientService } from "@sims/services";
import { ConfigModule } from "@sims/utilities/config";
import { IER12IntegrationService } from "./ier12-integration.service";
import { IER12FileService } from "./ier12-file.service";
import {
  SshService,
  StudentAssessmentService,
} from "@sims/integration/services";
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    SshService,
    StudentAssessmentService,
    IER12FileService,
    WorkflowClientService,
    IER12IntegrationService,
  ],
  exports: [IER12FileService, IER12IntegrationService],
})
export class IER12IntegrationModule {}
