import { Global, Module } from "@nestjs/common";
import { WorkflowClientService } from "@sims/services";
import { ConfigModule } from "@sims/utilities/config";
// import { IER12FileService } from "./institution-integration/ier-integration/ier12-file.service";
import { IER12IntegrationModule } from "./institution-integration/ier-integration/ier12-integration.module";
// import { IER12IntegrationService } from "./institution-integration/ier-integration/ier12-integration.service";
import { SshService, StudentAssessmentService } from "./services";
// todo: ann update this file
// todo: ann do we need this global
@Global()
@Module({
  imports: [ConfigModule, IER12IntegrationModule],
  providers: [SshService, StudentAssessmentService, WorkflowClientService],
})
export class IntegrationModule {}
