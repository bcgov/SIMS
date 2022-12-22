import { Module } from "@nestjs/common";
import { SequenceControlService } from "@sims/services";
import { SINValidationIntegrationService } from "./sin-validation-integration.service";
import { SINValidationProcessingService } from "./sin-validation-processing.service";
import { ConfigModule } from "@sims/utilities/config";
import { SshService } from "@sims/integrations/services";
import { StudentService } from "@sims/services/student/student.service";
import { SINValidationService } from "@sims/services/sin-validation/sin-validation.service";

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
  exports: [SINValidationIntegrationService, SINValidationProcessingService],
})
export class SINValidationModule {}
