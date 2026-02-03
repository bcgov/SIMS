import { faker } from "@faker-js/faker";
import {
  SystemLookupCategory,
  SystemLookupConfiguration,
  User,
} from "@sims/sims-db";

/**
 * Create a fake system lookup configuration.
 * @param relations Entity relations.
 * - `auditUser` audit user.
 * @param options system lookup configuration options.
 * - `initialValues` initial values to set in the system lookup configuration.
 * @returns fake system lookup configuration.
 */
export function createFakeSystemLookupConfiguration(
  relations: {
    auditUser: User;
  },
  options?: { initialValues?: Partial<SystemLookupConfiguration> },
): SystemLookupConfiguration {
  const systemLookupConfiguration = new SystemLookupConfiguration();
  systemLookupConfiguration.lookupCategory =
    options?.initialValues?.lookupCategory ?? SystemLookupCategory.Country;
  systemLookupConfiguration.lookupKey =
    options?.initialValues?.lookupKey ??
    faker.string.alphanumeric({ length: 50 });
  systemLookupConfiguration.lookupValue =
    options?.initialValues?.lookupValue ??
    faker.string.alphanumeric({ length: 100 });
  systemLookupConfiguration.creator = relations.auditUser;
  return systemLookupConfiguration;
}
