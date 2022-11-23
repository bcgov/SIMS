import { Global, Module } from "@nestjs/common";
import { IER12FileService } from "./institution-integration/ier-integration/ier12-file.service";
import { IER12IntegrationModule } from "./institution-integration/ier-integration/ier12-integration.module";
import { IER12IntegrationService } from "./institution-integration/ier-integration/ier12-integration.service";
import { SshService, StudentAssessmentService } from "./services";
// todo: ann update this file
// todo: ann do we need this global
@Global()
@Module({
  providers: [
    IER12FileService,
    IER12IntegrationService,
    SshService,
    StudentAssessmentService,
  ],
  exports: [IER12FileService, IER12IntegrationService],
  imports: [IER12IntegrationModule],
})
export class IntegrationModule {}
