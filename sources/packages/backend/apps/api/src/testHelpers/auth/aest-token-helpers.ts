import { UserPasswordCredential } from "@sims/utilities/config";
import { AuthorizedParties, ClientRole, IUserToken, Role } from "../../auth";
import { getCachedToken, mockJWTToken } from "./token-helpers";
import { TestingModule } from "@nestjs/testing";
import { FormSubmissionAuthRoles } from "../../services";
import { DynamicFormConfiguration } from "@sims/sims-db";

/**
 * Known AEST groups. The API right now performs authorization for
 * Ministry users based on the roles associated to these groups.
 * These groups represents the different logins with the different
 * set of roles to be used to execute E2E tests when roles validations
 * are required.
 */
export enum AESTGroups {
  BusinessAdministrators = "business-administrators",
  Operations = "operations",
  OperationsAdministrators = "operations-administrators",
  MOFOperations = "mof-operations",
}

/**
 * Gets different tokens for the Ministry application.
 * @param group group to have the token acquired.
 * When value is not passed then returns token for read-only user.
 * @returns a ministry token for the specific group.
 */
export async function getAESTToken(group?: AESTGroups): Promise<string> {
  let credential: UserPasswordCredential;
  switch (group) {
    case AESTGroups.BusinessAdministrators:
      credential = {
        userName: process.env.E2E_TEST_AEST_BUSINESS_ADMINISTRATORS_USER,
        password: process.env.E2E_TEST_PASSWORD,
      };
      break;
    case AESTGroups.Operations:
      credential = {
        userName: process.env.E2E_TEST_AEST_OPERATIONS_USER,
        password: process.env.E2E_TEST_PASSWORD,
      };
      break;
    case AESTGroups.OperationsAdministrators:
      credential = {
        userName: process.env.E2E_TEST_AEST_OPERATIONS_ADMINISTRATORS_USER,
        password: process.env.E2E_TEST_PASSWORD,
      };
      break;
    case AESTGroups.MOFOperations:
      credential = {
        userName: process.env.E2E_TEST_AEST_MOF_OPERATIONS_USER,
        password: process.env.E2E_TEST_PASSWORD,
      };
      break;
    default:
      credential = {
        userName: process.env.E2E_TEST_AEST_READ_ONLY_USER,
        password: process.env.E2E_TEST_PASSWORD,
      };
  }
  return getCachedToken(AuthorizedParties.aest, {
    userPasswordCredential: credential,
    uniqueTokenCache: group?.toString(),
  });
}

/**
 * Removes the provided roles from the JWT token.
 * @param testingModule nest testing module.
 * @param rolesToRemove client roles to be removed from the token payload.
 * @param azp the authorized party (client ID) from which the roles will be removed, default is "aest".
 */
export async function removeJWTUserRoles(
  testingModule: TestingModule,
  rolesToRemove: ClientRole[],
  azp = AuthorizedParties.aest,
): Promise<void> {
  await mockJWTToken(testingModule, (payload: IUserToken) => {
    const roles = payload.resource_access[azp]?.roles;
    if (roles && roles.length) {
      payload.resource_access[azp] = {
        roles: roles.filter((role) => !rolesToRemove.includes(role)),
      };
    }
  });
}

/**
 * Adds dynamic form configuration roles to the JWT token to authorize form submission actions.
 * @param testingModule nest testing module.
 * @param dynamicFormConfigurations dynamic form configurations to authorize.
 * @param roles form submission auth roles to grant for each configuration.
 */
export async function authorizeDynamicFormConfigurations(
  testingModule: TestingModule,
  dynamicFormConfigurations: DynamicFormConfiguration[],
  roles: FormSubmissionAuthRoles[],
): Promise<void> {
  await mockJWTToken(testingModule, (payload: IUserToken) => {
    const formRoles = dynamicFormConfigurations.flatMap(
      (dynamicFormConfiguration) =>
        roles.map((role) =>
          createFormRole(dynamicFormConfiguration.authorizationKey!, role),
        ),
    ) as Role[];
    payload.resource_access[AuthorizedParties.aest]?.roles.push(...formRoles);
  });
}

/**
 * Adds dynamic form configuration roles to the JWT token to authorize form submission actions.
 * @param testingModule nest testing module.
 * @param formsAndRolesCombination dynamic form configurations and their corresponding roles to authorize.
 */
export async function authorizeMultipleDynamicFormConfigurations(
  testingModule: TestingModule,
  formsAndRolesCombination: {
    formConfiguration: DynamicFormConfiguration;
    roles: FormSubmissionAuthRoles[];
  }[],
): Promise<void> {
  await mockJWTToken(testingModule, (payload: IUserToken) => {
    const formRoles = formsAndRolesCombination.flatMap(
      ({ formConfiguration, roles }) =>
        roles.map((role) =>
          createFormRole(formConfiguration.authorizationKey!, role),
        ),
    ) as Role[];
    payload.resource_access[AuthorizedParties.aest]?.roles.push(...formRoles);
  });
}

/**
 * Builds the role string for a dynamic form configuration and a given submission auth role.
 * @param authorizationKey the authorization key from the dynamic form configuration.
 * @param role the form submission auth role to grant.
 * @returns role in the format `forms.authorization-key.role`.
 */
function createFormRole(
  authorizationKey: string,
  role: FormSubmissionAuthRoles,
): string {
  return `forms.${authorizationKey}.${role}`;
}
