import { Module } from "@nestjs/common";
import { WorkflowClientService } from "@sims/services";
import { AuthModule } from "../../auth/auth.module";
import {
  ConfigService,
  SshService,
  StudentAssessmentService,
} from "../../services";
import { IERIntegrationService } from "./ier-integration.service";
import { IERRequestService } from "./ier-request.service";

@Module({
  imports: [AuthModule],
  providers: [
    SshService,
    StudentAssessmentService,
    ConfigService,
    IERRequestService,
    WorkflowClientService,
    IERIntegrationService,
  ],
  exports: [IERRequestService],
})
export class IERIntegrationModule {}
