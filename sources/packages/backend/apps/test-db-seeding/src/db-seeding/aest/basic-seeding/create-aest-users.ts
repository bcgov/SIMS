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
import * as faker from "faker";

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
  private async createAESTUsers(): Promise<void> {
    await this.createAESTUser(
      process.env.E2E_TEST_AEST_BUSINESS_ADMINISTRATORS_USER,
    );
    await this.createAESTUser(process.env.E2E_TEST_AEST_OPERATIONS_USER);
    await this.createAESTUser(
      process.env.E2E_TEST_AEST_OPERATIONS_ADMINISTRATORS_USER,
    );
    await this.createAESTUser(process.env.E2E_TEST_AEST_MOF_OPERATIONS_USER);
    await this.createAESTUser(process.env.E2E_TEST_AEST_READ_ONLY_USER);
  }

  /**
   * Create a fake AEST user persisted in the DB.
   * @param userName username of the AEST user to be created.
   */
  private async createAESTUser(userName: string): Promise<void> {
    // Create fake user.
    const fakeUser = createFakeUser(userName);
    fakeUser.firstName = faker.name.firstName();
    fakeUser.lastName = faker.name.firstName();
    // Save user to DB.
    await this.userRepo.save(fakeUser);
  }
}
