import { Module } from "@nestjs/common";
import {
  AssessmentSequentialProcessingService,
  ConfirmationOfEnrollmentService,
  ReportService,
  RestrictionSharedService,
  SequenceControlService,
  StudentRestrictionSharedService,
} from "@sims/services";
import { DisbursementReceiptIntegrationService } from "./disbursement-receipt.integration.service";
import { DisbursementReceiptProcessingService } from "./disbursement-receipt.processing.service";
import { LoggerModule } from "@sims/utilities/logger";
import { ConfigModule } from "@sims/utilities/config";
import {
  DisbursementReceiptService,
  SshService,
  DisbursementScheduleService,
} from "@sims/integrations/services";

@Module({
  imports: [LoggerModule, ConfigModule],
  providers: [
    SshService,
    DisbursementReceiptIntegrationService,
    DisbursementReceiptProcessingService,
    DisbursementReceiptService,
    DisbursementScheduleService,
    SequenceControlService,
    ReportService,
    StudentRestrictionSharedService,
    RestrictionSharedService,
    ConfirmationOfEnrollmentService,
    AssessmentSequentialProcessingService,
  ],
  exports: [DisbursementReceiptProcessingService],
})
export class DisbursementReceiptIntegrationModule {}
