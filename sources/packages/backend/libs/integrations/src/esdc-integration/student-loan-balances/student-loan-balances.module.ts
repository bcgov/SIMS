import { Module } from "@nestjs/common";
import { ConfigModule } from "@sims/utilities/config";
import {
  StudentService,
  SshService,
  StudentLoanBalancesService,
} from "@sims/integrations/services";
import { StudentLoanBalancesIntegrationService } from "./student-loan-balances.integration.service";
import { StudentLoanBalancesProcessingService } from "./student-loan-balances.processing.service";

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
