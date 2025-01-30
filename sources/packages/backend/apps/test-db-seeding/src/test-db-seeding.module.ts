import { Module } from "@nestjs/common";
import { DatabaseModule } from "@sims/sims-db";
import { MetadataScanner } from "@nestjs/core";
import { SeedExecutor } from "./seed-executors/seed-executor";
import { DiscoveryService } from "@golevelup/nestjs-discovery";
import { CleanDatabase } from "./clean-db/clean-db";
import {
  DesignationAgreementService,
  CreateInstitutionsAndAuthenticationUsers,
  InstitutionUserService,
} from "./db-seeding/institution";
import {
  InstitutionHelperService,
  UserTypeRoleHelperService,
} from "./services";
import { ConfigModule } from "@sims/utilities/config";
import {
  CreateAESTUsers,
  CreateCASDistributionAccounts,
} from "./db-seeding/aest";
import { CreateStudentUsers } from "./db-seeding/student";
import { CreateRestrictions } from "./db-seeding/restriction";
import { SystemUserModule } from "@sims/services";
import { LoggerModule } from "@sims/utilities/logger";

@Module({
  imports: [DatabaseModule, LoggerModule, SystemUserModule, ConfigModule],
  providers: [
    DesignationAgreementService,
    SeedExecutor,
    DiscoveryService,
    MetadataScanner,
    CleanDatabase,
    InstitutionUserService,
    InstitutionHelperService,
    UserTypeRoleHelperService,
    CreateInstitutionsAndAuthenticationUsers,
    CreateAESTUsers,
    CreateStudentUsers,
    CreateRestrictions,
    CreateCASDistributionAccounts,
  ],
})
export class TestDbSeedingModule {}
