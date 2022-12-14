import { Module } from "@nestjs/common";
import { DatabaseModule } from "@sims/sims-db";
import { MetadataScanner } from "@nestjs/core";
import { SeedExecutor } from "./seed-executors/seed-executor";
import { DiscoveryService } from "@golevelup/nestjs-discovery";
import { CleanDatabase } from "./clean-db/clean-db";
import {
  DesignationAgreementService,
  InstitutionUserService,
} from "./db-seeding/02-institution";
import {
  InstitutionHelperService,
  UserTypeRoleHelperService,
} from "./services";
import { ConfigModule } from "@sims/utilities/config";

@Module({
  imports: [DatabaseModule, ConfigModule],
  providers: [
    DesignationAgreementService,
    SeedExecutor,
    DiscoveryService,
    MetadataScanner,
    CleanDatabase,
    InstitutionUserService,
    InstitutionHelperService,
    UserTypeRoleHelperService,
  ],
})
export class TestDbSeedingModule {}
