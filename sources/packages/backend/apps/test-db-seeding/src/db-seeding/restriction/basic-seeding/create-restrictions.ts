import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Restriction } from "@sims/sims-db";
import {
  DataSeed,
  DataSeedMethod,
  SeedPriorityOrder,
} from "../../../seed-executors";
import { Repository } from "typeorm";
import { RESTRICTIONS_ADDITIONAL_DATA } from "./create-restrictions.model";
import { createFakeRestriction } from "@sims/test-utils";

@Injectable()
@DataSeed({ order: SeedPriorityOrder.Priority1 })
export class CreateRestrictions {
  constructor(
    @InjectRepository(Restriction)
    private readonly restrictionRepo: Repository<Restriction>,
  ) {}

  @DataSeedMethod()
  async createRestrictions(): Promise<void> {
    const additionalRestrictions = RESTRICTIONS_ADDITIONAL_DATA.map(
      (restrictionData) =>
        createFakeRestriction({ initialValues: { ...restrictionData } }),
    );
    await this.restrictionRepo.insert(additionalRestrictions);
  }
}
