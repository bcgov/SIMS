import { Module } from "@nestjs/common";
import {
  DisbursementOverawardService,
  SequenceControlService,
  StudentRestrictionSharedService,
  NoteSharedService,
  ConfirmationOfEnrollmentService,
  DisbursementScheduleSharedService,
  RestrictionSharedService,
  AssessmentSequentialProcessingService,
  StudentLoanBalanceSharedService,
} from "@sims/services";
import { ECertFullTimeFileFooter } from "./e-cert-full-time-integration/e-cert-files/e-cert-file-footer";
import { ECertFullTimeFileHeader } from "./e-cert-full-time-integration/e-cert-files/e-cert-file-header";
import { ECertFullTimeIntegrationService } from "./e-cert-full-time-integration/e-cert-full-time.integration.service";
import { ECertPartTimeFileFooter } from "./e-cert-part-time-integration/e-cert-files/e-cert-file-footer";
import { ECertPartTimeFileHeader } from "./e-cert-part-time-integration/e-cert-files/e-cert-file-header";
import { ECertPartTimeIntegrationService } from "./e-cert-part-time-integration/e-cert-part-time.integration.service";
import { ConfigModule } from "@sims/utilities/config";
import {
  DisbursementScheduleErrorsService,
  DisbursementScheduleService,
  ECertFeedbackErrorService,
  ECertGenerationService,
  ECertNotificationService,
  SshService,
} from "../../services";
import { SystemUserModule } from "@sims/services/system-users";
import { SFASApplicationService } from "@sims/services/sfas";
import {
  ApplyOverawardsDeductionsStep,
  ApplyStopBCFundingRestrictionStep,
  AssertLifeTimeMaximumFullTimeStep,
  CalculateEffectiveValueStep,
  CalculateTuitionRemittanceEffectiveAmountStep,
  CreateBCTotalGrantsStep,
  PersistCalculationsStep,
  RestrictionBypassesResolutionStep,
  ValidateDisbursementFullTimeStep,
  ValidateDisbursementPartTimeStep,
} from "@sims/integrations/services/disbursement-schedule/e-cert-processing-steps";
import {
  ECertPreValidationService,
  FullTimeCalculationProcess,
  PartTimeCalculationProcess,
} from "@sims/integrations/services/disbursement-schedule/e-cert-calculation";
import { FullTimeECertFileHandler } from "./full-time-e-cert-file-handler";
import { PartTimeECertFileHandler } from "./part-time-e-cert-file-handler";
import {
  MinistryBlockedDisbursementNotification,
  StudentBlockedDisbursementNotification,
} from "@sims/integrations/services/disbursement-schedule/e-cert-notification";

@Module({
  imports: [ConfigModule, SystemUserModule],
  providers: [
    SshService,
    ECertFullTimeIntegrationService,
    ECertPartTimeIntegrationService,
    SequenceControlService,
    DisbursementScheduleService,
    FullTimeECertFileHandler,
    PartTimeECertFileHandler,
    ECertPartTimeFileHeader,
    ECertPartTimeFileFooter,
    ECertFullTimeFileHeader,
    ECertFullTimeFileFooter,
    DisbursementScheduleErrorsService,
    RestrictionSharedService,
    StudentRestrictionSharedService,
    ECertGenerationService,
    DisbursementOverawardService,
    NoteSharedService,
    ConfirmationOfEnrollmentService,
    SFASApplicationService,
    DisbursementScheduleSharedService,
    ECertNotificationService,
    // e-Cert calculation steps.
    ValidateDisbursementFullTimeStep,
    ValidateDisbursementPartTimeStep,
    ApplyOverawardsDeductionsStep,
    CalculateEffectiveValueStep,
    ApplyStopBCFundingRestrictionStep,
    AssertLifeTimeMaximumFullTimeStep,
    CalculateTuitionRemittanceEffectiveAmountStep,
    CreateBCTotalGrantsStep,
    PersistCalculationsStep,
    RestrictionBypassesResolutionStep,
    FullTimeCalculationProcess,
    PartTimeCalculationProcess,
    AssessmentSequentialProcessingService,
    StudentLoanBalanceSharedService,
    ECertFeedbackErrorService,
    ECertPreValidationService,
    MinistryBlockedDisbursementNotification,
    StudentBlockedDisbursementNotification,
  ],
  exports: [
    FullTimeECertFileHandler,
    PartTimeECertFileHandler,
    FullTimeCalculationProcess,
    PartTimeCalculationProcess,
    ECertPreValidationService,
  ],
})
export class ECertIntegrationModule {}
