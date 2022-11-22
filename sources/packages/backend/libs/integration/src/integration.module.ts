import { Module } from "@nestjs/common";
import { IER12FileService } from "./institution-integration/ier-integration/ier12-file.service";
import { IER12IntegrationModule } from "./institution-integration/ier-integration/ier12-integration.module";
import { IER12IntegrationService } from "./institution-integration/ier-integration/ier12-integration.service";
import { SshService1, StudentAssessmentService1 } from "./services";
// todo: ann update this file
@Module({
  providers: [
    IER12FileService,
    IER12IntegrationService,
    SshService1,
    StudentAssessmentService1,
  ],
  imports: [IER12IntegrationModule],
})
export class IntegrationModule {}
