import { Application, SupportingUser, SupportingUserType } from "@sims/sims-db";
import { DataSource } from "typeorm";

/**
 * Creates a fake supporting user.
 * @param supportingUserType supporting user type to be created.
 * @param relations dependencies:
 * - `application`: application that the supporting user is associated with.
 * @returns a fake supporting user.
 */
export function createFakeSupportingUser(
  supportingUserType: SupportingUserType,
  relations: {
    application: Application;
  },
): SupportingUser {
  const supportingUser = new SupportingUser();
  supportingUser.application = relations.application;
  supportingUser.createdAt = new Date();
  supportingUser.updatedAt = new Date();
  supportingUser.supportingUserType = supportingUserType;
  return supportingUser;
}

/**
 * Saves a fake supporting user.
 * @param dataSource data source for the application.
 * @param supportingUserType supporting user type to be created.
 * @param relations dependencies:
 * - `application`: application that the supporting user is associated with.
 * @returns a persisted fake supporting user.
 */
export async function saveFakeSupportingUser(
  dataSource: DataSource,
  supportingUserType: SupportingUserType,
  relations: {
    application: Application;
  },
): Promise<SupportingUser> {
  const fakeSupportingUser = createFakeSupportingUser(
    supportingUserType,
    relations,
  );
  const supportingUserRepo = dataSource.getRepository(SupportingUser);
  return await supportingUserRepo.save(fakeSupportingUser);
}
