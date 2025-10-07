import { faker } from "@faker-js/faker";
import { User } from "@sims/sims-db";

/**
 * Reasonable default max length for user first and last names
 * that would be compatible with most tables in the DB.
 */
const MAX_USER_NAME_LENGTH = 50;

/**
 * Creates a fake user object.
 * @param userName optional user name.
 * @returns a User object with fake data.
 */
export function createFakeUser(userName?: string): User {
  // Creates a GUID to avoid conflicts in unique DB constraints.
  const uniqueId = faker.string.uuid();
  const user = new User();
  user.userName = userName ?? uniqueId;
  user.email = faker.internet.email();
  user.firstName = createShortUniqueNames(faker.person.firstName(), uniqueId);
  user.lastName = createShortUniqueNames(faker.person.lastName(), uniqueId);
  return user;
}

/**
 * Creates a short unique name by truncating the original name and appending a unique ID.
 * @param name original name.
 * @param uniqueId unique ID to append.
 * @returns a short unique name, up to a limit still keeping its uniqueness.
 */
function createShortUniqueNames(name: string, uniqueId: string): string {
  const uniqueIdLength = uniqueId.length + 1; // +1 for the underscore.
  return name.slice(0, MAX_USER_NAME_LENGTH - uniqueIdLength) + "_" + uniqueId;
}
