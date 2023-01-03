import { Module } from "@nestjs/common";
import { SequenceControlService } from "@sims/services";
import { MSFAAIntegrationService } from "./msfaa-integration.service";
import { MSFAARequestService } from "./msfaa-request.service";
import { MSFAAResponseService } from "./msfaa-response.service";
import { ConfigModule } from "@sims/utilities/config";
import { MSFAANumberService, SshService } from "@sims/integrations/services";

@Module({
  imports: [ConfigModule],
  providers: [
    SshService,
    MSFAAIntegrationService,
    MSFAARequestService,
    MSFAAResponseService,
    MSFAANumberService,
    SequenceControlService,
  ],
  exports: [MSFAARequestService, MSFAAResponseService],
})
export class MSFAAIntegrationModule {}
