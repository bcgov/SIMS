import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import {
  ConfigService,
  MSFAANumberService,
  SequenceControlService,
  SshService,
} from "../services";
import { MSFAAIntegrationService } from "./msfaa-integration.service";
import { MSFAAValidationService } from "./msfaa-validation.service";

@Module({
  imports: [AuthModule],
  providers: [
    SshService,
    MSFAAIntegrationService,
    MSFAAValidationService,
    MSFAANumberService,
    SequenceControlService,
    ConfigService,
  ],
  exports: [MSFAAIntegrationService, MSFAAValidationService],
})
export class MSFAAIntegrationModule {}
