import * as faker from "faker";
import { User } from "@sims/sims-db";

export function createFakeUser(userName?: string): User {
  const user = new User();
  user.userName = userName ?? faker.datatype.uuid();
  user.email = faker.internet.email();
  user.firstName = faker.name.firstName();
  user.lastName = faker.name.lastName();
  return user;
}
