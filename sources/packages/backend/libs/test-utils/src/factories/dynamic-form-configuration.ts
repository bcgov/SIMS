import {
  DynamicFormConfiguration,
  DynamicFormType,
  OfferingIntensity,
  ProgramYear,
} from "@sims/sims-db";
import * as faker from "faker";
export function createFakeDynamicFormConfiguration(
  formType: DynamicFormType,
  relations?: { programYear: ProgramYear },
  options?: {
    OfferingIntensity?: OfferingIntensity;
    formDefinitionName?: string;
  },
): DynamicFormConfiguration {
  const dynamicFormConfiguration = new DynamicFormConfiguration();
  dynamicFormConfiguration.formType = formType;
  dynamicFormConfiguration.programYear = relations?.programYear;
  dynamicFormConfiguration.offeringIntensity = options?.OfferingIntensity;
  dynamicFormConfiguration.formDefinitionName =
    options?.formDefinitionName ?? faker.random.alphaNumeric(50);
  return dynamicFormConfiguration;
}
