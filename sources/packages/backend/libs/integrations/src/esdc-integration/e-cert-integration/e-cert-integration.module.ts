import { Module } from "@nestjs/common";
import {
  DisbursementSchedulerService,
  SequenceControlService,
} from "@sims/services";
import { ECertFileHandler } from "./e-cert-file-handler";
import { ECertFullTimeFileFooter } from "./e-cert-full-time-integration/e-cert-files/e-cert-file-footer";
import { ECertFullTimeFileHeader } from "./e-cert-full-time-integration/e-cert-files/e-cert-file-header";
import { ECertFullTimeIntegrationService } from "./e-cert-full-time-integration/e-cert-full-time-integration.service";
import { ECertPartTimeFileFooter } from "./e-cert-part-time-integration/e-cert-files/e-cert-file-footer";
import { ECertPartTimeFileHeader } from "./e-cert-part-time-integration/e-cert-files/e-cert-file-header";
import { ECertPartTimeIntegrationService } from "./e-cert-part-time-integration/e-cert-part-time-integration.service";
import { ConfigModule } from "@sims/utilities/config";
import { SshService } from "@sims/integrations/services";
import { StudentRestrictionService } from "@sims/integrations/services/restriction/student-restriction.service";
import { DisbursementScheduleErrorsService } from "@sims/integrations/services/disbursement-schedule-errors/disbursement-schedule-errors.service";
import { RestrictionService } from "@sims/integrations/services/restriction/restriction.service";
import { StudentService } from "@sims/services/student/student.service";
import { SystemUsersService } from "@sims/services/system-users";

@Module({
  // imports: [AuthModule, ConfigModule],
  imports: [ConfigModule],
  providers: [
    SshService,
    ECertFullTimeIntegrationService,
    ECertPartTimeIntegrationService,
    SequenceControlService,
    DisbursementSchedulerService,
    StudentRestrictionService,
    ECertFileHandler,
    ECertPartTimeFileHeader,
    ECertPartTimeFileFooter,
    ECertFullTimeFileHeader,
    ECertFullTimeFileFooter,
    DisbursementScheduleErrorsService,
    RestrictionService,
    StudentService,
    // SFASIndividualService,
    // todo: ann SystemUsersService was nt there before
    SystemUsersService,
  ],
  exports: [
    ECertFullTimeIntegrationService,
    ECertPartTimeIntegrationService,
    ECertFileHandler,
    StudentRestrictionService,
  ],
})
export class ECertIntegrationModule {}
