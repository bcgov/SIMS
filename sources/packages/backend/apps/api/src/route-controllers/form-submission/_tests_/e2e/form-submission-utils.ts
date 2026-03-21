import { DynamicFormConfiguration, FormCategory } from "@sims/sims-db";
import {
  E2EDataSources,
  ensureDynamicFormConfigurationExists,
} from "@sims/test-utils";

/**
 * Create fake dynamic configurations to be shared by the form submission tests.
 * @param db data sources.
 * @returns an array with three dynamic configurations to be used as needed.
 */
export async function createFakeFormConfigurations(
  db: E2EDataSources,
): Promise<DynamicFormConfiguration[]> {
  // Create the form configurations to be used along the tests.
  // The names matter to ensure correct order.
  return Promise.all([
    ensureDynamicFormConfigurationExists(db, "Student application appeal A", {
      formCategory: FormCategory.StudentAppeal,
    }),
    ensureDynamicFormConfigurationExists(db, "Student application appeal B", {
      formCategory: FormCategory.StudentAppeal,
    }),
    ensureDynamicFormConfigurationExists(db, "Student form A", {
      formCategory: FormCategory.StudentForm,
    }),
  ]);
}
