import { Module } from "@nestjs/common";
import { SequenceControlService } from "@sims/services";
import { DisbursementReceiptIntegrationService } from "./disbursement-receipt-integration.service";
import { DisbursementReceiptProcessingService } from "./disbursement-receipt-processing.service";
import { DisbursementReceiptRequestService } from "./disbursement-receipt-request.service";
import { LoggerModule } from "@sims/utilities/logger";
import { ConfigModule } from "@sims/utilities/config";
import {
  IntegrationDisbursementReceiptService,
  ReportService,
  SshService,
  IntegrationDisbursementSchedulerService,
} from "@sims/integrations/services";

@Module({
  imports: [LoggerModule, ConfigModule],
  providers: [
    SshService,
    DisbursementReceiptIntegrationService,
    DisbursementReceiptProcessingService,
    DisbursementReceiptRequestService,
    IntegrationDisbursementReceiptService,
    IntegrationDisbursementSchedulerService,
    SequenceControlService,
    ReportService,
  ],
  exports: [
    DisbursementReceiptIntegrationService,
    DisbursementReceiptProcessingService,
    DisbursementReceiptRequestService,
    IntegrationDisbursementReceiptService,
    IntegrationDisbursementSchedulerService,
    ReportService,
  ],
})
export class DisbursementReceiptIntegrationModule {}
