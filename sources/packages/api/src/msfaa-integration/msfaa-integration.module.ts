import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import {
  ConfigService,
  MSFAANumberService,
  SequenceControlService,
  SshService,
} from "../services";
import { MSFAAIntegrationService } from "./msfaa-integration.service";
import { MSFAARequestService } from "./msfaa-request.service";

@Module({
  imports: [AuthModule],
  providers: [
    SshService,
    MSFAAIntegrationService,
    MSFAARequestService,
    MSFAANumberService,
    SequenceControlService,
    ConfigService,
  ],
  exports: [MSFAAIntegrationService, MSFAARequestService],
})
export class MSFAAIntegrationModule {}
