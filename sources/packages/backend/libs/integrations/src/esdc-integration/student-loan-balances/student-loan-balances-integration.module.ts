import { Module } from "@nestjs/common";
import { ConfigModule } from "@sims/utilities/config";
import { StudentService, SshService } from "@sims/integrations/services";
import {
  StudentLoanBalancesIntegrationService,
  StudentLoanBalancesProcessingService,
} from "@sims/integrations/esdc-integration";

@Module({
  imports: [ConfigModule],
  providers: [
    SshService,
    StudentService,
    StudentLoanBalancesIntegrationService,
    StudentLoanBalancesProcessingService,
  ],
  exports: [StudentLoanBalancesProcessingService],
})
export class StudentLoanBalancesIntegrationModule {}
