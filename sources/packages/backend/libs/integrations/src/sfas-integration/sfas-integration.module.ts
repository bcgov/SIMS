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
  SIMSToSFASIntegrationService,
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
    SIMSToSFASIntegrationService,
    SIMSToSFASProcessingService,
  ],
  exports: [
    SFASIntegrationService,
    SFASIntegrationProcessingService,
    SFASIndividualService,
    SFASApplicationService,
    SFASRestrictionService,
    SFASPartTimeApplicationsService,
    SIMSToSFASService,
    SIMSToSFASProcessingService,
  ],
})
export class SFASIntegrationModule {}
