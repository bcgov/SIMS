import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ConfigService, SshService, SFASIndividualService } from "../services";
import { SFASIntegrationProcessingService } from "./sfas-integration-processing.service";
import { SFASIntegrationService } from "./sfas-integration.service";

@Module({
  imports: [AuthModule],
  providers: [
    SshService,
    ConfigService,
    SFASIntegrationService,
    SFASIntegrationProcessingService,
    SFASIndividualService,
  ],
  exports: [SFASIntegrationService, SFASIntegrationProcessingService],
})
export class SFASIntegrationModule {}
