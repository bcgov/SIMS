import { Module } from "@nestjs/common";
import { SequenceControlService } from "@sims/services";
import { SINValidationIntegrationService } from "./sin-validation.integration.service";
import { SINValidationProcessingService } from "./sin-validation.processing.service";
import { ConfigModule } from "@sims/utilities/config";
import {
  StudentService,
  SshService,
  SINValidationService,
} from "@sims/integrations/services";

@Module({
  imports: [ConfigModule],
  providers: [
    SshService,
    SINValidationService,
    StudentService,
    SINValidationIntegrationService,
    SINValidationProcessingService,
    SequenceControlService,
  ],
  exports: [SINValidationProcessingService],
})
export class SINValidationModule {}
