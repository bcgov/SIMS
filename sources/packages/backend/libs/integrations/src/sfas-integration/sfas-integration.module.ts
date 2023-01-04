import { Module } from "@nestjs/common";
import { SshService } from "@sims/integrations/services";
import { ConfigModule } from "@sims/utilities/config";
import {
  SFASIndividualService,
  SFASApplicationService,
  SFASRestrictionService,
  SFASPartTimeApplicationsService,
} from "../services/sfas";
import { SFASIntegrationProcessingService } from "./sfas-integration-processing.service";
import { SFASIntegrationService } from "./sfas-integration.service";

@Module({
  imports: [ConfigModule],
  providers: [
    SshService,
    SFASIntegrationService,
    SFASIntegrationProcessingService,
    SFASIndividualService,
    SFASApplicationService,
    SFASRestrictionService,
    SFASPartTimeApplicationsService,
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
