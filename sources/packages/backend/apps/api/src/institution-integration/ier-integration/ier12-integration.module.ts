import { Module } from "@nestjs/common";
import { WorkflowClientService } from "@sims/services";
import { AuthModule } from "../../auth/auth.module";
import {
  ConfigService,
  SshService,
  StudentAssessmentService,
} from "../../services";
import { IER12IntegrationService } from "./ier12-integration.service";
import { IER12FileService } from "./ier12-file.service";

@Module({
  imports: [AuthModule],
  providers: [
    SshService,
    StudentAssessmentService,
    ConfigService,
    IER12FileService,
    WorkflowClientService,
    IER12IntegrationService,
  ],
  exports: [IER12FileService],
})
export class IER12IntegrationModule {}
