import { Module } from "@nestjs/common";
import { DatabaseModule, DBEntities } from "@sims/sims-db";
import { TypeOrmModule } from "@nestjs/typeorm";
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

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature(DBEntities)],
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
