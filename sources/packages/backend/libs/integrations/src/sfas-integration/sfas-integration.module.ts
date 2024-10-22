import { Module } from "@nestjs/common";
import { SshService } from "@sims/integrations/services";
import { ConfigModule } from "@sims/utilities/config";
import {
  SFASIndividualService,
  SFASApplicationService,
  SFASRestrictionService,
  SFASPartTimeApplicationsService,
  SIMSToSFASService,
} from "../services/sfas";
import { SFASIntegrationService } from "./sfas-integration.service";
import {
  SFASIntegrationProcessingService,
  SIMSToSFASProcessingService,
} from ".";

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
    SIMSToSFASService,
    SIMSToSFASProcessingService,
  ],
  exports: [
    SFASIntegrationService,
    SFASIntegrationProcessingService,
    SFASIndividualService,
    SFASApplicationService,
    SFASRestrictionService,
    SFASPartTimeApplicationsService,
    SIMSToSFASProcessingService,
  ],
})
export class SFASIntegrationModule {}
