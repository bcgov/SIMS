import {
  DynamicFormConfiguration,
  DynamicFormType,
  OfferingIntensity,
  ProgramYear,
} from "@sims/sims-db";
import { E2EDataSources } from "@sims/test-utils/data-source/e2e-data-source";
import * as faker from "faker";

/**
 * Create a fake dynamic form configuration.
 * @param formType form type.
 * @param relations entity relations.
 * @param options dynamic form configuration options
 * - `offeringIntensity` offering intensity.
 * - `formDefinitionName` form definition name.
 * @returns fake dynamic form configuration.
 */
export function createFakeDynamicFormConfiguration(
  formType: DynamicFormType,
  relations: { programYear: ProgramYear },
  options?: {
    offeringIntensity?: OfferingIntensity;
    formDefinitionName?: string;
  },
): DynamicFormConfiguration {
  const dynamicFormConfiguration = new DynamicFormConfiguration();
  dynamicFormConfiguration.formType = formType;
  dynamicFormConfiguration.programYear = relations?.programYear;
  dynamicFormConfiguration.offeringIntensity = options?.offeringIntensity;
  dynamicFormConfiguration.formDefinitionName =
    options?.formDefinitionName ?? faker.random.alphaNumeric(50);
  return dynamicFormConfiguration;
}

/**
 * Ensure dynamic form configuration exists.
 * @param db e2e DataSources.
 * @param programYear program year.
 * @param formType dynamic form type.
 * @param options dynamic form configuration options
 * - `offeringIntensity` offering intensity.
 * @returns dynamic form configuration.
 */
export async function ensureDynamicFormConfigurationExists(
  db: E2EDataSources,
  programYear: ProgramYear,
  formType: DynamicFormType,
  options?: {
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
        formType,
        programYear: { id: programYear.id },
        offeringIntensity: options?.offeringIntensity,
      },
    });
  if (existingDynamicFormConfiguration) {
    return existingDynamicFormConfiguration;
  }
  const dynamicFormConfiguration = createFakeDynamicFormConfiguration(
    formType,
    { programYear },
    { offeringIntensity: options?.offeringIntensity },
  );
  return db.dynamicFormConfiguration.save(dynamicFormConfiguration);
}
