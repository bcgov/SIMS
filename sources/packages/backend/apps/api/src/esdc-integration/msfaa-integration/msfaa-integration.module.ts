import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { MSFAANumberService, SshService } from "../../services";
import { SequenceControlService } from "@sims/services";
import { MSFAAIntegrationService } from "./msfaa-integration.service";
import { MSFAARequestService } from "./msfaa-request.service";
import { MSFAAResponseService } from "./msfaa-response.service";
import { ConfigModule } from "@sims/utilities/config";

@Module({
  imports: [AuthModule, ConfigModule],
  providers: [
    SshService,
    MSFAAIntegrationService,
    MSFAARequestService,
    MSFAAResponseService,
    MSFAANumberService,
    SequenceControlService,
  ],
  exports: [MSFAAIntegrationService, MSFAARequestService, MSFAAResponseService],
})
export class MSFAAIntegrationModule {}
