import * as faker from "faker";
import { User } from "@sims/sims-db";

/**
 * Creates a fake user.
 * @param options user options.
 * - `initialValues` user values.
 * @returns a fake user.
 */
export function createFakeUser(options?: {
  initialValue?: Partial<User>;
}): User {
  const user = new User();
  user.userName = options?.initialValue?.userName ?? faker.datatype.uuid();
  user.email = options?.initialValue?.email ?? faker.internet.email();
  user.firstName = options?.initialValue?.firstName ?? faker.name.firstName();
  user.lastName = options?.initialValue?.lastName ?? faker.name.lastName();
  return user;
}
