import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  DynamicFormConfiguration,
  DynamicFormType,
  FormCategory,
  OfferingIntensity,
} from "@sims/sims-db";
import { Repository } from "typeorm";

@Injectable()
export class DynamicFormConfigurationService {
  /**
   * @private All dynamic form configurations.
   */
  private dynamicFormConfigurations: ReadonlyArray<DynamicFormConfiguration> =
    [];
  constructor(
    @InjectRepository(DynamicFormConfiguration)
    private readonly dynamicFormConfigurationRepo: Repository<DynamicFormConfiguration>,
  ) {}

  /**
   * Load all dynamic form configurations.
   */
  async loadAllDynamicFormConfigurations(): Promise<void> {
    const configurations = (this.dynamicFormConfigurations =
      await this.dynamicFormConfigurationRepo.find({
        select: {
          id: true,
          formType: true,
          programYear: { id: true },
          offeringIntensity: true,
          formDefinitionName: true,
          formCategory: true,
          formDescription: true,
          allowBundledSubmission: true,
          hasApplicationScope: true,
        },
        relations: {
          programYear: true,
        },
      }));
    // Freeze each configuration object to make it immutable.
    configurations.forEach((configuration) => Object.freeze(configuration));
    // Freeze the array to prevent adding/removing items at runtime.
    this.dynamicFormConfigurations = Object.freeze(configurations);
  }

  /**
   * Get form definition name by form type and program year.
   * @param dynamicFormType dynamic form type.
   * @param options dynamic form options
   * - `programYearId` program year id.
   * - `offeringIntensity` offering intensity.
   * @returns form definition name.
   */
  getDynamicFormName(
    dynamicFormType: DynamicFormType,
    options?: { programYearId?: number; offeringIntensity?: OfferingIntensity },
  ): string | undefined {
    return (
      this.getFormConfiguration(dynamicFormType, options)?.formDefinitionName ??
      undefined
    );
  }

  /**
   * Get the form configuration by form type and program year.
   * @param dynamicFormType dynamic form type.
   * @param options dynamic form options
   * - `programYearId` program year id.
   * - `offeringIntensity` offering intensity.
   * @returns form definition.
   */
  getFormConfiguration(
    dynamicFormType: DynamicFormType,
    options?: { programYearId?: number; offeringIntensity?: OfferingIntensity },
  ): DynamicFormConfiguration | undefined {
    const programYearId = options?.programYearId ?? null;
    const offeringIntensity = options?.offeringIntensity ?? null;
    return this.dynamicFormConfigurations.find(
      (dynamicFormConfiguration) =>
        dynamicFormConfiguration.formType === dynamicFormType &&
        dynamicFormConfiguration.programYear.id === programYearId &&
        dynamicFormConfiguration.offeringIntensity === offeringIntensity,
    );
  }

  /**
   * Get form configurations by by their categories.
   * @param formCategories form categories.
   * @returns dynamic form configurations for the requested categories.
   */
  getFormsByCategory(
    ...formCategories: FormCategory[]
  ): DynamicFormConfiguration[] {
    return this.dynamicFormConfigurations.filter((dynamicFormConfiguration) =>
      formCategories.includes(dynamicFormConfiguration.formCategory),
    );
  }

  /**
   * Get a form configuration by its id.
   * @param formId form id.
   * @returns dynamic form configuration for the requested id.
   */
  getFormById(formId: number): DynamicFormConfiguration | undefined {
    return this.dynamicFormConfigurations.find(
      (dynamicFormConfiguration) => dynamicFormConfiguration.id === formId,
    );
  }
}
