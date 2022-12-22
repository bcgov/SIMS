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
import {
  DisbursementScheduleErrorsService,
  IntegrationRestrictionService,
  SshService,
  IntegrationStudentRestrictionService,
} from "@sims/integrations/services";
import { StudentService } from "@sims/services/student/student.service";
import { SystemUsersService } from "@sims/services/system-users";

@Module({
  imports: [ConfigModule],
  providers: [
    SshService,
    ECertFullTimeIntegrationService,
    ECertPartTimeIntegrationService,
    SequenceControlService,
    DisbursementSchedulerService,
    IntegrationStudentRestrictionService,
    ECertFileHandler,
    ECertPartTimeFileHeader,
    ECertPartTimeFileFooter,
    ECertFullTimeFileHeader,
    ECertFullTimeFileFooter,
    DisbursementScheduleErrorsService,
    IntegrationRestrictionService,
    StudentService,
    SystemUsersService,
  ],
  exports: [
    ECertFullTimeIntegrationService,
    ECertPartTimeIntegrationService,
    ECertFileHandler,
    IntegrationStudentRestrictionService,
  ],
})
export class ECertIntegrationModule {}
