import { Module } from "@nestjs/common";
import { DesignationAgreementPendingService } from "./designation-agreement/designation-agreement-pending.service";
import {
  DatabaseModule,
  DesignationAgreement,
  Institution,
  InstitutionLocation,
  User,
} from "@sims/sims-db";
import { DesignationAgreementApprovalService } from "./designation-agreement/designation-agreement-approval.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DiscoveryModule, MetadataScanner } from "@nestjs/core";
import { TestOrganizerService } from "./test-organizer/test-organizer.service";
import { DiscoveryService } from "@golevelup/nestjs-discovery";
import { CleanDbService } from "./clean-db/clean-db.service";

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([
      DesignationAgreement,
      Institution,
      User,
      InstitutionLocation,
      DiscoveryModule,
    ]),
  ],
  controllers: [],
  providers: [
    DesignationAgreementPendingService,
    DesignationAgreementApprovalService,
    TestOrganizerService,
    TestOrganizerService,
    DiscoveryService,
    MetadataScanner,
    CleanDbService,
  ],
})
export class TestDbSeedingModule {}
