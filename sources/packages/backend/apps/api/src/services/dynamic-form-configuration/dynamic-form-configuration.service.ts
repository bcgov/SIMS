import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  DynamicFormConfiguration,
  DynamicFormType,
  OfferingIntensity,
} from "@sims/sims-db";
import { Repository } from "typeorm";

@Injectable()
export class DynamicFormConfigurationService {
  /**
   * All dynamic form configurations.
   */
  private dynamicFormConfigurations: DynamicFormConfiguration[] = [];
  constructor(
    @InjectRepository(DynamicFormConfiguration)
    private readonly dynamicFormConfigurationRepo: Repository<DynamicFormConfiguration>,
  ) {}

  /**
   * Load all dynamic form configurations.
   */
  async loadAllDynamicFormConfigurations(): Promise<void> {
    this.dynamicFormConfigurations =
      await this.dynamicFormConfigurationRepo.find({
        select: {
          id: true,
          formType: true,
          programYear: { id: true, programYear: true },
          offeringIntensity: true,
          formDefinitionName: true,
        },
        relations: {
          programYear: true,
        },
      });
  }

  /**
   * Get form definition name by form type and program year.
   * @param dynamicFormType dynamic form type.
   * @param programYearId program year id.
   * @param offeringIntensity offering intensity.
   * @returns form definition name.
   */
  getFormByFormTypeAndProgramYear(
    dynamicFormType: DynamicFormType,
    programYearId: number,
    offeringIntensity?: OfferingIntensity,
  ): string {
    const offeringIntensityConfiguration = offeringIntensity ?? null;
    const dynamicForm = this.dynamicFormConfigurations.find(
      (dynamicFormConfiguration) =>
        dynamicFormConfiguration.formType === dynamicFormType &&
        dynamicFormConfiguration.programYear.id === programYearId &&
        dynamicFormConfiguration.offeringIntensity ===
          offeringIntensityConfiguration,
    );
    if (!dynamicForm) {
      throw new Error(
        "Form definition for the provided configuration not found.",
      );
    }
    return dynamicForm.formDefinitionName;
  }
}
