import { Module } from "@nestjs/common";
import { ConfigModule } from "@sims/utilities/config";
import { SshService } from "@sims/integrations/services";
import { DefaultedStudentLoansIntegrationService } from "./defaulted-student-loans.integration.service";
import { DefaultedStudentLoansProcessingService } from "./defaulted-student-loans.processing.service";

@Module({
  imports: [ConfigModule],
  providers: [
    SshService,
    DefaultedStudentLoansIntegrationService,
    DefaultedStudentLoansProcessingService,
  ],
  exports: [DefaultedStudentLoansProcessingService],
})
export class DefaultedStudentLoansIntegrationModule {}
