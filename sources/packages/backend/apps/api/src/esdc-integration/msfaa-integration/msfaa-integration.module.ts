import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { ConfigService, MSFAANumberService, SshService } from "../../services";
import { SequenceControlService } from "@sims/services";
import { MSFAAIntegrationService } from "./msfaa-integration.service";
import { MSFAARequestService } from "./msfaa-request.service";
import { MSFAAResponseService } from "./msfaa-response.service";

@Module({
  imports: [AuthModule],
  providers: [
    SshService,
    MSFAAIntegrationService,
    MSFAARequestService,
    MSFAAResponseService,
    MSFAANumberService,
    SequenceControlService,
    ConfigService,
  ],
  exports: [MSFAAIntegrationService, MSFAARequestService, MSFAAResponseService],
})
export class MSFAAIntegrationModule {}
