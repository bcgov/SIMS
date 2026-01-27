import {
  FormCategory,
  FormSubmissionGrouping,
  OfferingIntensity,
} from "@sims/sims-db";
import { IsEnum, IsOptional, IsPositive } from "class-validator";

export class DynamicFormConfigurationAPIOutDTO {
  formDefinitionName: string;
  formType: string;
  formCategory: FormCategory;
  formSubmissionGrouping?: FormSubmissionGrouping;
}

export class DynamicFormConfigurationsAPIOutDTO {
  configurations: DynamicFormConfigurationAPIOutDTO[];
}

export enum FormCategoryAPIInDTO {
  /**
   * Appeals related forms.
   */
  StudentAppeal = "Student appeal",
  /**
   * Any form submitted by a student that does not fall under
   * the appeals process and have multiple applications.
   */
  StudentForm = "Student form",
}

export class DynamicFormConfigurationAPIInDTO {
  @IsOptional()
  @IsPositive()
  programYearId?: number;
  @IsOptional()
  @IsEnum(OfferingIntensity)
  offeringIntensity?: OfferingIntensity;
}
