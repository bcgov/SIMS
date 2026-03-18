import {
  DynamicFormConfiguration,
  DynamicFormType,
  FormCategory,
  OfferingIntensity,
  ProgramYear,
} from "@sims/sims-db";
import { E2EDataSources } from "@sims/test-utils/data-source/e2e-data-source";
import { faker } from "@faker-js/faker";

/**
 * Create a fake dynamic form configuration.
 * @param formType form type.
 * @param relations entity relations.
 * @param options dynamic form configuration options.
 * - `initialValues` initial values for the dynamic form configuration.
 * @returns fake dynamic form configuration.
 */
export function createFakeDynamicFormConfiguration(
  formType: DynamicFormType | string,
  relations?: { programYear?: ProgramYear },
  options?: {
    initialValues?: Partial<DynamicFormConfiguration>;
  },
): DynamicFormConfiguration {
  const dynamicFormConfiguration = new DynamicFormConfiguration();
  dynamicFormConfiguration.formType = formType as DynamicFormType;
  dynamicFormConfiguration.programYear = relations?.programYear;
  dynamicFormConfiguration.offeringIntensity =
    options?.initialValues?.offeringIntensity;
  dynamicFormConfiguration.formDefinitionName =
    options?.initialValues?.formDefinitionName ??
    faker.string.alphanumeric({ length: 50 });
  dynamicFormConfiguration.formCategory =
    options?.initialValues?.formCategory ?? FormCategory.System;
  dynamicFormConfiguration.hasApplicationScope =
    options?.initialValues?.hasApplicationScope ?? false;
  dynamicFormConfiguration.allowBundledSubmission =
    options?.initialValues?.allowBundledSubmission ?? false;
  return dynamicFormConfiguration;
}

/**
 * Ensure dynamic form configuration exists.
 * @param db e2e DataSources.
 * @param formType dynamic form type.
 * @param options dynamic form configuration options
 * - `formCategory` form category.
 * - `programYear` program year.
 * - `offeringIntensity` offering intensity.
 * @returns dynamic form configuration.
 */
export async function ensureDynamicFormConfigurationExists(
  db: E2EDataSources,
  formType: DynamicFormType | string,
  options?: {
    formCategory?: FormCategory;
    programYear?: ProgramYear;
    offeringIntensity?: OfferingIntensity;
  },
): Promise<DynamicFormConfiguration> {
  const existingDynamicFormConfiguration =
    await db.dynamicFormConfiguration.findOne({
      select: {
        id: true,
        offeringIntensity: true,
        formType: true,
        formDefinitionName: true,
      },
      relations: { programYear: true },
      where: {
        formType: formType as DynamicFormType,
        programYear: { id: options?.programYear.id },
        offeringIntensity: options?.offeringIntensity,
        formCategory: options?.formCategory,
      },
    });
  if (existingDynamicFormConfiguration) {
    return existingDynamicFormConfiguration;
  }
  const dynamicFormConfiguration = createFakeDynamicFormConfiguration(
    formType as DynamicFormType,
    { programYear: options?.programYear },
    {
      initialValues: {
        formCategory: options?.formCategory,
        offeringIntensity: options?.offeringIntensity,
      },
    },
  );
  return db.dynamicFormConfiguration.save(dynamicFormConfiguration);
}
