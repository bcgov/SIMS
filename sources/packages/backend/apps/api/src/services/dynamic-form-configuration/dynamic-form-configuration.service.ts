import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  DynamicFormConfiguration,
  DynamicFormType,
  FormCategory,
  FormSubmissionGrouping,
  OfferingIntensity,
} from "@sims/sims-db";
import { Repository } from "typeorm";

const STUDENT_FORM_CATEGORIES = new Set<FormCategory>([
  FormCategory.StudentForm,
  FormCategory.StudentAppeal,
]);

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
          formSubmissionGrouping: true,
        },
        relations: {
          programYear: true,
        },
      });
  }

  /**
   * Get form definition by form type and program year.
   * @param dynamicFormType dynamic form type.
   * @param options dynamic form options
   * - `programYearId` program year id.
   * - `offeringIntensity` offering intensity.
   * @returns form definition
   */
  getDynamicForm(
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

  getDynamicFormName(
    dynamicFormType: DynamicFormType,
    options?: { programYearId?: number; offeringIntensity?: OfferingIntensity },
  ): string | undefined {
    const programYearId = options?.programYearId ?? null;
    const offeringIntensity = options?.offeringIntensity ?? null;
    const form = this.dynamicFormConfigurations.find(
      (dynamicFormConfiguration) =>
        dynamicFormConfiguration.formType === dynamicFormType &&
        dynamicFormConfiguration.programYear.id === programYearId &&
        dynamicFormConfiguration.offeringIntensity === offeringIntensity,
    );
    return form?.formDefinitionName ?? undefined;
  }

  getDynamicFormById(
    configurationId: number,
  ): DynamicFormConfiguration | undefined {
    return this.dynamicFormConfigurations.find(
      (configuration) => configuration.id === configurationId,
    );
  }

  getDynamicStudentForms(): DynamicFormConfiguration[] {
    return this.dynamicFormConfigurations.filter((dynamicFormConfiguration) =>
      STUDENT_FORM_CATEGORIES.has(dynamicFormConfiguration.formCategory),
    );
  }

  configurationExists(configurationId: number): boolean {
    return !!this.getDynamicFormById(configurationId);
  }

  hasGroupContext(
    configurationId: number,
    formCategory: FormCategory,
    formSubmissionGrouping: FormSubmissionGrouping,
  ): boolean {
    const configuration = this.getDynamicFormById(configurationId);

    return (
      configuration.formCategory === formCategory &&
      configuration.formSubmissionGrouping === formSubmissionGrouping
    );
  }
}
