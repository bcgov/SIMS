// TODO: These DTOs will have their final version once the API is fully integrated.
import { FormCategory } from "@sims/sims-db";
import { JSON_10KB } from "apps/api/src/constants";
import {
  KnownSupplementaryData,
  KnownSupplementaryDataKey,
} from "../../../services/form-submission/form-submission.models";
import { JsonMaxSize } from "../../../utilities/class-validation";
import { Transform, Type } from "class-transformer";
import {
  IsPositive,
  IsDefined,
  IsOptional,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  IsEnum,
  IsArray,
} from "class-validator";

export class FormSubmissionConfigurationAPIOutDTO {
  id: number;
  formDefinitionName: string;
  formType: string;
  formCategory: FormCategory;
  formDescription: string;
  allowBundledSubmission: boolean;
  hasApplicationScope: boolean;
}

export class FormSubmissionConfigurationsAPIOutDTO {
  configurations: FormSubmissionConfigurationAPIOutDTO[];
}

export class FormSupplementaryDataAPIInDTO {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @Transform(({ value }) => value.split(","))
  @IsEnum(KnownSupplementaryDataKey, { each: true })
  dataKeys: KnownSupplementaryDataKey[];
  @IsOptional()
  @IsPositive()
  applicationId?: number;
}

export class FormSupplementaryDataAPIOutDTO {
  formData: KnownSupplementaryData;
}

/**
 * Individual form item in the form submission.
 */
export class FormSubmissionItemAPIInDTO {
  @IsPositive()
  dynamicConfigurationId: number;
  @IsDefined()
  @JsonMaxSize(JSON_10KB)
  formData: KnownSupplementaryData & Record<string, unknown>;
  @IsDefined()
  files: string[];
}

/**
 * Form submission with one to many form items for individual Ministry decision.
 * All forms must belong to same category and may be related to an application.
 * When related to an application, the application ID must be provided and all
 * forms must have application scope.
 * For submissions with an application scope, that must enforce the applicationId,
 * the validation is executed outside the DTO scope.
 */
export class FormSubmissionAPIInDTO {
  @IsOptional()
  @IsPositive()
  applicationId?: number;
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => FormSubmissionItemAPIInDTO)
  items: FormSubmissionItemAPIInDTO[];
}
