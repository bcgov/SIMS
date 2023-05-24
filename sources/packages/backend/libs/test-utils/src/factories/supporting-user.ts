import { Application, SupportingUser, SupportingUserType } from "@sims/sims-db";

/**
 * Creates a fake supporting user.
 * @param relations dependencies:
 * - `application`: application that the supporting user is associated with.
 * @returns a fake supporting user.
 */
export function createFakeSupportingUser(relations: {
  application: Application;
}): SupportingUser {
  const supportingUser = new SupportingUser();
  supportingUser.application = relations.application;
  supportingUser.createdAt = new Date();
  supportingUser.updatedAt = new Date();
  supportingUser.supportingUserType = SupportingUserType.Parent;
  return supportingUser;
}
