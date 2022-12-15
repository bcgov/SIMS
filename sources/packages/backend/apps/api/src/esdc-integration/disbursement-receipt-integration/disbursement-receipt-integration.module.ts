import { Module } from "@nestjs/common";
import {
  DisbursementScheduleService,
  DisbursementReceiptService,
  StudentRestrictionService,
  RestrictionService,
  ReportService,
  StudentService,
} from "../../services";
import { SequenceControlService } from "@sims/services";
import { SFASIndividualService } from "@sims/services/sfas";
import { DisbursementReceiptIntegrationService } from "./disbursement-receipt-integration.service";
import { DisbursementReceiptProcessingService } from "./disbursement-receipt-processing.service";
import { DisbursementReceiptRequestService } from "./disbursement-receipt-request.service";
import { LoggerModule } from "@sims/utilities/logger";
import { ConfigModule } from "@sims/utilities/config";
import { SshService } from "@sims/integrations/services";

@Module({
  imports: [LoggerModule, ConfigModule],
  providers: [
    SshService,
    DisbursementReceiptIntegrationService,
    DisbursementReceiptProcessingService,
    DisbursementReceiptRequestService,
    DisbursementReceiptService,
    DisbursementScheduleService,
    SequenceControlService,
    StudentRestrictionService,
    ReportService,
    RestrictionService,
    StudentService,
    SFASIndividualService,
  ],
  exports: [
    DisbursementReceiptIntegrationService,
    DisbursementReceiptProcessingService,
    DisbursementReceiptRequestService,
  ],
})
export class DisbursementReceiptIntegrationModule {}
