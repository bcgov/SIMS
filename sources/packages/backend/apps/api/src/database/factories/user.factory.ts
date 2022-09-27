import * as faker from "faker";
import { User } from "../entities";

export async function userFactory(incoming?: Partial<User>): Promise<User> {
  const user = new User();
  const uuid = faker.random.uuid();
  user.email = incoming?.email || faker.internet.email();
  user.firstName = incoming?.firstName || faker.name.firstName();
  user.lastName = incoming?.lastName || faker.name.lastName();
  user.userName = incoming?.userName || `${uuid}@bceid`;
  return user;
}
