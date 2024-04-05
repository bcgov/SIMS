import * as faker from "faker";
import { User } from "@sims/sims-db";

/**
 * Creates a fake user.
 * @param userName user name.
 * @param options fake user options.
 * - `initialValues` initial values to be used to create the user.
 * @returns user entity ready to be persisted.
 */
export function createFakeUser(
  userName?: string,
  options?: {
    initialValue?: Partial<User>;
  },
): User {
  const user = new User();
  user.userName =
    userName ?? options?.initialValue?.userName ?? faker.datatype.uuid();
  user.email = options?.initialValue?.email ?? faker.internet.email();
  user.firstName = options?.initialValue?.firstName ?? faker.name.firstName();
  user.lastName = options?.initialValue?.lastName ?? faker.name.lastName();
  return user;
}
