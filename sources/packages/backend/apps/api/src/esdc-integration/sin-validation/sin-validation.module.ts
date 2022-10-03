import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import {
  ConfigService,
  SequenceControlService,
  SFASIndividualService,
  SINValidationService,
  SshService,
  StudentService,
} from "../../services";
import { SINValidationIntegrationService } from "./sin-validation-integration.service";
import { SINValidationProcessingService } from "./sin-validation-processing.service";

@Module({
  imports: [AuthModule],
  providers: [
    SshService,
    SFASIndividualService,
    StudentService,
    SINValidationService,
    SINValidationIntegrationService,
    SINValidationProcessingService,
    SequenceControlService,
    ConfigService,
  ],
  exports: [SINValidationIntegrationService, SINValidationProcessingService],
})
export class SINValidationModule {}
