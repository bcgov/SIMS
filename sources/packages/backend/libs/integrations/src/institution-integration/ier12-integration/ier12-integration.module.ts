import { Global, Module } from "@nestjs/common";
import { WorkflowClientService } from "@sims/services";
import { ConfigModule } from "@sims/utilities/config";
import { IER12IntegrationService } from "./ier12.integration.service";
import { IER12ProcessingService } from "./ier12.processing.service";
import {
  StudentAssessmentService,
  SshService,
  DisbursementReceiptService,
} from "@sims/integrations/services";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    SshService,
    StudentAssessmentService,
    IER12ProcessingService,
    WorkflowClientService,
    IER12IntegrationService,
    DisbursementReceiptService,
  ],
  exports: [IER12ProcessingService, IER12IntegrationService],
})
export class IER12IntegrationModule {}
