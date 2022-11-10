import { Module } from "@nestjs/common";
import { WorkflowClientService } from "@sims/services";
import { AuthModule } from "../../auth/auth.module";
import {
  ConfigService,
  SshService,
  StudentAssessmentService,
} from "../../services";
import { IER12IntegrationService } from "./ier12-integration.service";
import { IER12RequestService } from "./ier12-request.service";

@Module({
  imports: [AuthModule],
  providers: [
    SshService,
    StudentAssessmentService,
    ConfigService,
    IER12RequestService,
    WorkflowClientService,
    IER12IntegrationService,
  ],
  exports: [IER12RequestService],
})
export class IER12IntegrationModule {}
