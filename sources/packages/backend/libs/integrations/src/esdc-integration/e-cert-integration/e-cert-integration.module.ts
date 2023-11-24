import { Module } from "@nestjs/common";
import {
  DisbursementOverawardService,
  SequenceControlService,
  StudentRestrictionSharedService,
  NoteSharedService,
  ConfirmationOfEnrollmentService,
  DisbursementScheduleSharedService,
  RestrictionSharedService,
} from "@sims/services";
import { ECertFileHandler } from "./e-cert-file-handler";
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
  ECertGenerationService,
  SshService,
} from "../../services";
import { SystemUsersService } from "@sims/services/system-users";
import { SFASApplicationService } from "@sims/services/sfas";
import {
  ApplyOverawardsDeductionsStep,
  ApplyStopBCFundingRestrictionFullTimeStep,
  AssertLifeTimeMaximumFullTimeStep,
  CalculateEffectiveValueStep,
  CalculateTuitionRemittanceEffectiveAmountStep,
  CreateBCTotalGrantsStep,
  PersistCalculationsStep,
  ValidateDisbursementFullTimeStep,
  ValidateDisbursementPartTimeStep,
} from "@sims/integrations/services/disbursement-schedule/e-cert-processing-steps";
import {
  FullTimeCalculationProcess,
  PartTimeCalculationProcess,
} from "@sims/integrations/services/disbursement-schedule/e-cert-calculation";

@Module({
  imports: [ConfigModule],
  providers: [
    SshService,
    ECertFullTimeIntegrationService,
    ECertPartTimeIntegrationService,
    SequenceControlService,
    DisbursementScheduleService,
    ECertFileHandler,
    ECertPartTimeFileHeader,
    ECertPartTimeFileFooter,
    ECertFullTimeFileHeader,
    ECertFullTimeFileFooter,
    DisbursementScheduleErrorsService,
    SystemUsersService,
    RestrictionSharedService,
    StudentRestrictionSharedService,
    ECertGenerationService,
    DisbursementOverawardService,
    NoteSharedService,
    ConfirmationOfEnrollmentService,
    SFASApplicationService,
    DisbursementScheduleSharedService,
    // e-Cert calculation steps.
    ValidateDisbursementFullTimeStep,
    ValidateDisbursementPartTimeStep,
    ApplyOverawardsDeductionsStep,
    CalculateEffectiveValueStep,
    ApplyStopBCFundingRestrictionFullTimeStep,
    AssertLifeTimeMaximumFullTimeStep,
    CalculateTuitionRemittanceEffectiveAmountStep,
    CreateBCTotalGrantsStep,
    PersistCalculationsStep,
    FullTimeCalculationProcess,
    PartTimeCalculationProcess,
  ],
  exports: [
    ECertFileHandler,
    FullTimeCalculationProcess,
    PartTimeCalculationProcess,
  ],
})
export class ECertIntegrationModule {}
