import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import {
  SFASIndividualService,
  SINValidationService,
  SshService,
  StudentService,
} from "../../services";
import { SequenceControlService } from "@sims/services";
import { SINValidationIntegrationService } from "./sin-validation-integration.service";
import { SINValidationProcessingService } from "./sin-validation-processing.service";
import { ConfigModule } from "@sims/utilities/config";

@Module({
  imports: [AuthModule, ConfigModule],
  providers: [
    SshService,
    SFASIndividualService,
    StudentService,
    SINValidationService,
    SINValidationIntegrationService,
    SINValidationProcessingService,
    SequenceControlService,
  ],
  exports: [SINValidationIntegrationService, SINValidationProcessingService],
})
export class SINValidationModule {}
