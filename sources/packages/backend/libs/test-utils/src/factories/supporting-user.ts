import {
  Application,
  SupportingUser,
  SupportingUserType,
  User,
} from "@sims/sims-db";

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
    user?: User;
  },
  options?: {
    initialValues: Partial<SupportingUser>;
  },
): SupportingUser {
  const supportingUser = new SupportingUser();
  supportingUser.application = relations.application;
  supportingUser.sin = options?.initialValues?.sin;
  supportingUser.createdAt = new Date();
  supportingUser.updatedAt = new Date();
  supportingUser.supportingUserType =
    options?.initialValues?.supportingUserType ?? SupportingUserType.Parent;
  supportingUser.supportingData =
    options?.initialValues?.supportingData ?? null;
  supportingUser.isAbleToReport =
    options?.initialValues?.isAbleToReport ?? true;
  supportingUser.user = relations?.user ?? null;
  return supportingUser;
}
