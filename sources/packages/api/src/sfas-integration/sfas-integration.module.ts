import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ConfigService, SshService } from "../services";
import { IndividualDataRecordProcess } from "./processes/individual-data-record-process";
import { SFASIntegrationProcessingService } from "./sfas-integration-processing.service";
import { SFASIntegrationService } from "./sfas-integration.service";

@Module({
  imports: [AuthModule],
  providers: [
    SshService,
    ConfigService,
    SFASIntegrationService,
    SFASIntegrationProcessingService,
    IndividualDataRecordProcess,
  ],
  exports: [SFASIntegrationService, SFASIntegrationProcessingService],
})
export class SFASIntegrationModule {}
