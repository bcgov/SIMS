import { Module } from "@nestjs/common";
import {
  MSFAANumberSharedService,
  SequenceControlService,
  SystemUsersService,
} from "@sims/services";
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
    MSFAANumberSharedService,
    SystemUsersService,
    SequenceControlService,
  ],
  exports: [
    MSFAARequestProcessingService,
    MSFAAResponseProcessingService,
    MSFAANumberSharedService,
  ],
})
export class MSFAAIntegrationModule {}
