import { faker } from "@faker-js/faker";
import { User } from "@sims/sims-db";

export function createFakeUser(userName?: string): User {
  // Creates a GUID to avoid conflicts in unique DB constraints.
  const uniqueId = faker.string.uuid();
  const user = new User();
  user.userName = userName ?? uniqueId;
  user.email = faker.internet.email();
  user.firstName = `${faker.person.firstName()}_${uniqueId}`;
  user.lastName = `${faker.person.lastName()}_${uniqueId}`;
  return user;
}
