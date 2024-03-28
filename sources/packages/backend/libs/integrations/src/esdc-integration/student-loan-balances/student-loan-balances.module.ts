import { Module } from "@nestjs/common";
import { ConfigModule } from "@sims/utilities/config";
import {
  StudentService,
  SshService,
  StudentLoanBalancesService,
} from "@sims/integrations/services";
import {
  StudentLoanBalancesIntegrationService,
  StudentLoanBalancesProcessingService,
} from "@sims/integrations/esdc-integration";

@Module({
  imports: [ConfigModule],
  providers: [
    SshService,
    StudentService,
    StudentLoanBalancesService,
    StudentLoanBalancesIntegrationService,
    StudentLoanBalancesProcessingService,
  ],
  exports: [StudentLoanBalancesProcessingService],
})
export class StudentLoanBalancesModule {}
