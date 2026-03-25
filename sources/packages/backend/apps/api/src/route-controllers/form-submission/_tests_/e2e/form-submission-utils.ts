import { DynamicFormConfiguration, FormCategory } from "@sims/sims-db";
import {
  E2EDataSources,
  ensureDynamicFormConfigurationExists,
} from "@sims/test-utils";

/**
 * Available dynamic configurations to be used in the form submission tests.
 */
export interface DynamicConfigurationTestData {
  /**
   * Student appeal expected to have an associations and possibility of bundled submission.
   */
  studentAppealApplicationA: DynamicFormConfiguration;
  /**
   * Student appeal expected to have an associations and possibility of bundled submission.
   */
  studentAppealApplicationB: DynamicFormConfiguration;
  /**
   * Student appeal, no application associations and no possibility of bundled submission.
   */
  studentAppealA: DynamicFormConfiguration;
  /**
   * Student appeal, no application associations and no possibility of bundled submission.
   */
  studentAppealB: DynamicFormConfiguration;
  /**
   * Student form, no application associations and no possibility of bundled submission.
   */
  studentFormA: DynamicFormConfiguration;
}

/**
 * Create fake dynamic configurations to be shared by the form submission tests.
 * @param db data sources.
 * @returns an object with dynamic configurations to be used as needed.
 */
export async function createFakeFormConfigurations(
  db: E2EDataSources,
): Promise<DynamicConfigurationTestData> {
  // Create the form configurations to be used along the tests.
  // The names matter to ensure correct order.
  const [
    studentAppealApplicationA,
    studentAppealApplicationB,
    studentAppealA,
    studentAppealB,
    studentFormA,
  ] = await Promise.all([
    ensureDynamicFormConfigurationExists(db, "Student application appeal A", {
      formCategory: FormCategory.StudentAppeal,
      hasApplicationScope: true,
      allowBundledSubmission: true,
    }),
    ensureDynamicFormConfigurationExists(db, "Student application appeal B", {
      formCategory: FormCategory.StudentAppeal,
      hasApplicationScope: true,
      allowBundledSubmission: true,
    }),
    ensureDynamicFormConfigurationExists(db, "Student appeal A", {
      formCategory: FormCategory.StudentAppeal,
      hasApplicationScope: false,
      allowBundledSubmission: false,
    }),
    ensureDynamicFormConfigurationExists(db, "Student appeal B", {
      formCategory: FormCategory.StudentAppeal,
      hasApplicationScope: false,
      allowBundledSubmission: false,
    }),
    ensureDynamicFormConfigurationExists(db, "Student form A", {
      formCategory: FormCategory.StudentForm,
      hasApplicationScope: false,
      allowBundledSubmission: false,
    }),
  ]);
  return {
    studentAppealApplicationA,
    studentAppealApplicationB,
    studentAppealA,
    studentAppealB,
    studentFormA,
  };
}
