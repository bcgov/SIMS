import { Module } from "@nestjs/common";
import { SshService } from "@sims/integrations/services";
import { ConfigModule } from "@sims/utilities/config";
import { AuthModule } from "../auth/auth.module";
import {
  SFASIndividualService,
  SFASApplicationService,
  SFASRestrictionService,
  SFASPartTimeApplicationsService,
  StudentService,
} from "../services";
import { SFASIntegrationProcessingService } from "./sfas-integration-processing.service";
import { SFASIntegrationService } from "./sfas-integration.service";

@Module({
  imports: [AuthModule, ConfigModule],
  providers: [
    SshService,
    SFASIntegrationService,
    SFASIntegrationProcessingService,
    SFASIndividualService,
    SFASApplicationService,
    SFASRestrictionService,
    SFASPartTimeApplicationsService,
    StudentService,
  ],
  exports: [
    SFASIntegrationService,
    SFASIntegrationProcessingService,
    SFASIndividualService,
    SFASApplicationService,
    SFASRestrictionService,
    SFASPartTimeApplicationsService,
  ],
})
export class SFASIntegrationModule {}
