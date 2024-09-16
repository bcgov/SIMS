import * as faker from "faker";
import { User } from "@sims/sims-db";

export function createFakeUser(userName?: string): User {
  // Creates a GUID to avoid conflicts in unique DB constraints.
  const uniqueId = faker.datatype.uuid();
  const user = new User();
  user.userName = userName ?? uniqueId;
  user.email = faker.internet.email();
  user.firstName = `${faker.name.firstName()}_${uniqueId}`;
  user.lastName = `${faker.name.lastName()}_${uniqueId}`;
  return user;
}
