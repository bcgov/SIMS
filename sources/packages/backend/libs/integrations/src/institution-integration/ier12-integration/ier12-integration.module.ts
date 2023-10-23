import { Global, Module } from "@nestjs/common";
import {
  ApplicationSharedService,
  DisbursementOverawardService,
  NoteSharedService,
  WorkflowClientService,
} from "@sims/services";
import { ConfigModule } from "@sims/utilities/config";
import { IER12IntegrationService } from "./ier12.integration.service";
import { IER12ProcessingService } from "./ier12.processing.service";
import {
  StudentAssessmentService,
  SshService,
} from "@sims/integrations/services";
import {
  ApplicationEventCodeDuringAssessmentUtilsService,
  ApplicationEventCodeDuringEnrolmentAndCompletedUtilsService,
  ApplicationEventCodeUtilsService,
  ApplicationEventDateUtilsService,
} from "./utils-service";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    SshService,
    StudentAssessmentService,
    IER12ProcessingService,
    WorkflowClientService,
    IER12IntegrationService,
    DisbursementOverawardService,
    NoteSharedService,
    ApplicationSharedService,
    ApplicationEventCodeUtilsService,
    ApplicationEventCodeDuringAssessmentUtilsService,
    ApplicationEventCodeDuringEnrolmentAndCompletedUtilsService,
    ApplicationEventDateUtilsService,
  ],
  exports: [IER12ProcessingService, IER12IntegrationService],
})
export class IER12IntegrationModule {}
