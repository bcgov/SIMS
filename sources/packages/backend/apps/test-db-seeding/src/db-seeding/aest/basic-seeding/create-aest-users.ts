import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "@sims/sims-db";
import { createFakeUser } from "@sims/test-utils";
import {
  DataSeed,
  DataSeedMethod,
  SeedPriorityOrder,
} from "../../../seed-executors";
import { Repository } from "typeorm";

@Injectable()
@DataSeed({ order: SeedPriorityOrder.Priority1 })
export class CreateAESTUsers {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Create AEST users used for tests.
   */
  @DataSeedMethod()
  async createAESTUsers(): Promise<void> {
    const businessAdministratorsUserPromise = this.createAESTUser(
      process.env.E2E_TEST_AEST_BUSINESS_ADMINISTRATORS_USER,
    );
    const operationsUserPromise = this.createAESTUser(
      process.env.E2E_TEST_AEST_OPERATIONS_USER,
    );
    const operationsAdministratorsUserPromise = this.createAESTUser(
      process.env.E2E_TEST_AEST_OPERATIONS_ADMINISTRATORS_USER,
    );
    const mofOperationsUserPromise = this.createAESTUser(
      process.env.E2E_TEST_AEST_MOF_OPERATIONS_USER,
    );
    const readOnlyUserPromise = this.createAESTUser(
      process.env.E2E_TEST_AEST_READ_ONLY_USER,
    );
    await Promise.all([
      businessAdministratorsUserPromise,
      operationsUserPromise,
      operationsAdministratorsUserPromise,
      mofOperationsUserPromise,
      readOnlyUserPromise,
    ]);
  }

  /**
   * Create a fake AEST user persisted in the DB.
   * @param userName username of the AEST user to be created.
   */
  private async createAESTUser(userName: string): Promise<User> {
    // Create fake user.
    const fakeUser = createFakeUser(userName);
    // Save user to DB.
    return this.userRepo.save(fakeUser);
  }
}
