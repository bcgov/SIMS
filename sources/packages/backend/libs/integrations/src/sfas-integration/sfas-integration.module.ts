import { Module } from "@nestjs/common";
import { SshService } from "@sims/integrations/services";
import { ConfigModule } from "@sims/utilities/config";
import {
  SFASIndividualImportService,
  SFASApplicationImportService,
  SFASRestrictionImportService,
  SFASPartTimeApplicationsImportService,
  SIMSToSFASService,
  SFASApplicationDependantImportService,
  SFASApplicationDisbursementImportService,
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
    SFASIndividualImportService,
    SFASApplicationImportService,
    SFASRestrictionImportService,
    SFASPartTimeApplicationsImportService,
    SIMSToSFASService,
    SIMSToSFASIntegrationService,
    SIMSToSFASProcessingService,
    SFASApplicationDependantImportService,
    SFASApplicationDisbursementImportService,
  ],
  exports: [
    SFASIntegrationService,
    SFASIntegrationProcessingService,
    SIMSToSFASService,
    SIMSToSFASProcessingService,
  ],
})
export class SFASIntegrationModule {}
