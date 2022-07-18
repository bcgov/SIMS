require("../../../env_setup");
import { closeDB, setupDB } from "../../testHelpers";
import { DataSource, Repository } from "typeorm";
import * as faker from "faker";

import { User } from "../entities/user.model";

describe.skip("Test User model", () => {
  let dataSource: DataSource;
  beforeAll(async () => {
    dataSource = await setupDB();
  });
  afterAll(async () => {
    await closeDB();
  });

  it("should save user model object", async () => {
    // Save
    const repo: Repository<User> = dataSource.getRepository(User);
    const sub = new User();
    sub.userName = faker.random.uuid();
    sub.email = faker.internet.email();
    await repo.save(sub);

    // Fetch
    const item = await repo.findByIds([sub.id]);
    expect(item.length).toBeGreaterThan(0);
    const r = item[0];
    expect(r.id).toEqual(sub.id);

    // Remove
    await repo.remove(r);
  });
});
