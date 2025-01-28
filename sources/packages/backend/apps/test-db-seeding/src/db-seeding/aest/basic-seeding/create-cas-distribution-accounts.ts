import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CASDistributionAccount, User } from "@sims/sims-db";
import {
  DataSeed,
  DataSeedMethod,
  SeedPriorityOrder,
} from "../../../seed-executors";
import { Repository } from "typeorm";
import { CAS_DISTRIBUTION_ACCOUNTS_INITIAL_DATE } from "./create-cas-distribution-accounts.models";

import { createFakeCASDistributionAccount } from "@sims/test-utils";
import { SystemUsersService } from "@sims/services";

@Injectable()
@DataSeed({ order: SeedPriorityOrder.Priority1 })
export class CreateCASDistributionAccounts {
  constructor(
    @InjectRepository(CASDistributionAccount)
    private readonly casDistributionAccount: Repository<CASDistributionAccount>,
    private readonly systemUserService: SystemUsersService,
  ) {}

  /**
   * Create AEST users used for tests.
   */
  @DataSeedMethod()
  async createCASDistributionAccounts(): Promise<void> {
    // Create CAS distribution accounts.
    const accountsToSave = CAS_DISTRIBUTION_ACCOUNTS_INITIAL_DATE.map((data) =>
      createFakeCASDistributionAccount(
        { creator: this.systemUserService.systemUser },
        { initialValues: data },
      ),
    );
    // Save accounts.
    await this.casDistributionAccount.save(accountsToSave);
  }
}
