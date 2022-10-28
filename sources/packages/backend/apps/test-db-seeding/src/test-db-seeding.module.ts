import { Module } from "@nestjs/common";
import { DesignationAgreementPendingService } from "./designation-agreement/designation-agreement-pending.service";
import { DatabaseModule } from "@sims/sims-db";

@Module({
  imports: [DatabaseModule],
  controllers: [],
  providers: [DesignationAgreementPendingService],
})
export class TestDbSeedingModule {}
