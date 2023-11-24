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
import { SystemUserModule } from "@sims/services/system-users";
import { SFASApplicationService } from "@sims/services/sfas";

@Module({
  imports: [ConfigModule, SystemUserModule],
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
    RestrictionSharedService,
    StudentRestrictionSharedService,
    ECertGenerationService,
    DisbursementOverawardService,
    NoteSharedService,
    ConfirmationOfEnrollmentService,
    SFASApplicationService,
    DisbursementScheduleSharedService,
  ],
  exports: [ECertFileHandler],
})
export class ECertIntegrationModule {}
