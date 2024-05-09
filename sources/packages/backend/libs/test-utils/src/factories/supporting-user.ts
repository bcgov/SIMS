import { Application, SupportingUser, SupportingUserType } from "@sims/sims-db";

/**
 * Creates a fake supporting user.
 * @param relations dependencies:
 * - `application`: application that the supporting user is associated with.
 * @param options student options.
 * - `initialValues` supporting user values.
 * @returns a fake supporting user.
 */
export function createFakeSupportingUser(
  relations: {
    application: Application;
  },
  options?: {
    initialValues: Partial<SupportingUser>;
  },
): SupportingUser {
  const supportingUser = new SupportingUser();
  supportingUser.application = relations.application;
  supportingUser.createdAt = new Date();
  supportingUser.updatedAt = new Date();
  supportingUser.supportingUserType =
    options?.initialValues?.supportingUserType ?? SupportingUserType.Parent;
  supportingUser.supportingData =
    options?.initialValues?.supportingData ?? null;
  return supportingUser;
}
