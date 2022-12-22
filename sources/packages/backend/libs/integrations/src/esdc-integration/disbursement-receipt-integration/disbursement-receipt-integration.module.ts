import { Module } from "@nestjs/common";
import { SequenceControlService } from "@sims/services";
import { DisbursementReceiptIntegrationService } from "./disbursement-receipt-integration.service";
import { DisbursementReceiptProcessingService } from "./disbursement-receipt-processing.service";
import { DisbursementReceiptRequestService } from "./disbursement-receipt-request.service";
import { LoggerModule } from "@sims/utilities/logger";
import { ConfigModule } from "@sims/utilities/config";
import {
  DisbursementReceiptService,
  ReportService,
  SshService,
  DisbursementSchedulerService,
} from "@sims/integrations/services";

@Module({
  imports: [LoggerModule, ConfigModule],
  providers: [
    SshService,
    DisbursementReceiptIntegrationService,
    DisbursementReceiptProcessingService,
    DisbursementReceiptRequestService,
    DisbursementReceiptService,
    DisbursementSchedulerService,
    SequenceControlService,
    // StudentRestrictionService,
    ReportService,
    // RestrictionService,
    // StudentService,
    // SFASIndividualService,
  ],
  exports: [
    DisbursementReceiptIntegrationService,
    DisbursementReceiptProcessingService,
    DisbursementReceiptRequestService,
  ],
})
export class DisbursementReceiptIntegrationModule {}
