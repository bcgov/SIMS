import { ProgramYear, DynamicFormType, OfferingIntensity } from "@sims/sims-db";
import {
  E2EDataSources,
  ensureDynamicFormConfigurationExists,
} from "@sims/test-utils";
import { DynamicFormConfigurationService } from "../../services";

/**
 * Creates a student application form configuration for the given program year for both Full-time and Part-time.
 * @param db e2e DataSources.
 * @param programYear program year.
 */
export async function createPYStudentApplicationFormConfiguration(
  db: E2EDataSources,
  programYear: ProgramYear,
  dynamicFormConfigurationService: DynamicFormConfigurationService,
): Promise<void> {
  // Ensure the dynamic form configuration exists.
  const fullTimeConfiguration = ensureDynamicFormConfigurationExists(
    db,
    DynamicFormType.StudentFinancialAidApplication,
    {
      programYear,
      offeringIntensity: OfferingIntensity.fullTime,
    },
  );
  const partTimeConfiguration = ensureDynamicFormConfigurationExists(
    db,
    DynamicFormType.StudentFinancialAidApplication,
    {
      programYear,
      offeringIntensity: OfferingIntensity.partTime,
    },
  );
  await Promise.all([fullTimeConfiguration, partTimeConfiguration]);
  // Reload all dynamic form configurations.
  await dynamicFormConfigurationService.loadAllDynamicFormConfigurations();
}
