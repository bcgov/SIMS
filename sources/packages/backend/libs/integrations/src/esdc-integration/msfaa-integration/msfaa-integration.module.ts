import { Module } from "@nestjs/common";
import { SequenceControlService } from "@sims/services";
import { MSFAAIntegrationService } from "./msfaa.integration.service";
import { MSFAARequestProcessingService } from "./msfaa-request.processing.service";
import { MSFAAResponseProcessingService } from "./msfaa-response.processing.service";
import { ConfigModule } from "@sims/utilities/config";
import { MSFAANumberService, SshService } from "@sims/integrations/services";

@Module({
  imports: [ConfigModule],
  providers: [
    SshService,
    MSFAAIntegrationService,
    MSFAARequestProcessingService,
    MSFAAResponseProcessingService,
    MSFAANumberService,
    SequenceControlService,
  ],
  exports: [MSFAARequestProcessingService, MSFAAResponseProcessingService],
})
export class MSFAAIntegrationModule {}
