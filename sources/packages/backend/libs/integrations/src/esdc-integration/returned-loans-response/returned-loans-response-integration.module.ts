import { Module } from "@nestjs/common";
import { ConfigModule } from "@sims/utilities/config";
import { SshService } from "@sims/integrations/services";
import { ReturnedLoansResponseIntegrationService } from "./returned-loans-response.integration.service";
import { ReturnedLoansResponseProcessingService } from "./returned-loans-response.processing.service";
import { DefaultedStudentLoansIntegrationModule } from "@sims/integrations/finance/defaulted-student-loans-integration/defaulted-student-loans.integration.module";

@Module({
  imports: [ConfigModule, DefaultedStudentLoansIntegrationModule],
  providers: [
    SshService,
    ReturnedLoansResponseIntegrationService,
    ReturnedLoansResponseProcessingService,
  ],
  exports: [ReturnedLoansResponseProcessingService],
})
export class ReturnedLoansResponseIntegrationModule {}
