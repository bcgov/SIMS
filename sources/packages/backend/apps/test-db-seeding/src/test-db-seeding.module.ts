import { Module } from "@nestjs/common";
import {
  DatabaseModule,
  DesignationAgreement,
  Institution,
  InstitutionLocation,
  InstitutionUser,
  InstitutionUserAuth,
  InstitutionUserTypeAndRole,
  User,
} from "@sims/sims-db";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DiscoveryModule, MetadataScanner } from "@nestjs/core";
import { SeedExecutor } from "./seed-executors/seed-executor";
import { DiscoveryService } from "@golevelup/nestjs-discovery";
import { CleanDb } from "./clean-db/clean-db";
import {
  DesignationAgreementService,
  InstitutionUserService,
} from "./db-seeding/02-institution";
import {
  InstitutionHelperService,
  UserTypeRoleHelperService,
} from "./test-seed-helper-services";

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([
      DesignationAgreement,
      Institution,
      User,
      InstitutionLocation,
      DiscoveryModule,
      InstitutionUser,
      InstitutionUserTypeAndRole,
      InstitutionUserAuth,
    ]),
  ],
  controllers: [],
  providers: [
    DesignationAgreementService,
    SeedExecutor,
    DiscoveryService,
    MetadataScanner,
    CleanDb,
    InstitutionUserService,
    InstitutionHelperService,
    UserTypeRoleHelperService,
  ],
})
export class TestDbSeedingModule {}
