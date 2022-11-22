import { Module } from "@nestjs/common";
import { WorkflowClientService } from "@sims/services";
import { ConfigService } from "@sims/utilities/config";
import {
  SshService1,
  StudentAssessmentService1,
} from "@sims/integration/services";
import { AuthModule } from "../../auth/auth.module";
import { IER12FileService } from "@sims/integration/institution-integration/ier-integration/ier12-file.service";
import { IER12IntegrationService } from "@sims/integration/institution-integration/ier-integration/ier12-integration.service";

@Module({
  imports: [AuthModule],
  providers: [
    SshService1,
    StudentAssessmentService1,
    ConfigService,
    IER12FileService,
    WorkflowClientService,
    IER12IntegrationService,
  ],
  exports: [IER12FileService],
})
export class IER12IntegrationModule {}
