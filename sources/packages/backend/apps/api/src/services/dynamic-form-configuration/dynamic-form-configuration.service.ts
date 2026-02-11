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
      });
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
   * @returns form definition
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

  getFormsByCategory(
    ...formCategories: FormCategory[]
  ): DynamicFormConfiguration[] {
    return this.dynamicFormConfigurations.filter((dynamicFormConfiguration) =>
      formCategories.includes(dynamicFormConfiguration.formCategory),
    );
  }
}
