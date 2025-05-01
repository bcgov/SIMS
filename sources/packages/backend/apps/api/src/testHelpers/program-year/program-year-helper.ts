import {
  ProgramYear,
  DynamicFormType,
  OfferingIntensity,
  DynamicFormConfiguration,
} from "@sims/sims-db";
import {
  E2EDataSources,
  ensureDynamicFormConfigurationExists,
} from "@sims/test-utils";
import { DynamicFormConfigurationService } from "../../services";

/**
 * Creates a student application form configuration for the given program year for both Full-time and Part-time.
 * @param db e2e DataSources.
 * @param programYear program year.
 * @returns student application form configuration for both full-time and part-time.
 */
export async function createPYStudentApplicationFormConfiguration(
  db: E2EDataSources,
  programYear: ProgramYear,
  dynamicFormConfigurationService: DynamicFormConfigurationService,
): Promise<{
  fullTimeConfiguration: DynamicFormConfiguration;
  partTimeConfiguration: DynamicFormConfiguration;
}> {
  // Ensure the dynamic form configuration exists.
  const fullTimeConfigurationPromise = ensureDynamicFormConfigurationExists(
    db,
    DynamicFormType.StudentFinancialAidApplication,
    {
      programYear,
      offeringIntensity: OfferingIntensity.fullTime,
    },
  );
  const partTimeConfigurationPromise = ensureDynamicFormConfigurationExists(
    db,
    DynamicFormType.StudentFinancialAidApplication,
    {
      programYear,
      offeringIntensity: OfferingIntensity.partTime,
    },
  );
  const [fullTimeConfiguration, partTimeConfiguration] = await Promise.all([
    fullTimeConfigurationPromise,
    partTimeConfigurationPromise,
  ]);
  // Reload all dynamic form configurations.
  await dynamicFormConfigurationService.loadAllDynamicFormConfigurations();

  return {
    fullTimeConfiguration,
    partTimeConfiguration,
  };
}
