import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { SINValidationService, StudentService } from "../../services";
import { SequenceControlService } from "@sims/services";
import { SFASIndividualService } from "@sims/services/sfas";
import { SINValidationIntegrationService } from "./sin-validation-integration.service";
import { SINValidationProcessingService } from "./sin-validation-processing.service";
import { ConfigModule } from "@sims/utilities/config";
import { SshService } from "@sims/integrations/services";

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
