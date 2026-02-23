import { FormCategory } from "@sims/sims-db";
import { JSON_10KB } from "../../../constants";
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

/**
 * Forms supplementary data necessary for a dynamic form
 * submissions (e.g., program year, parents).
 */
export class FormSupplementaryDataAPIInDTO {
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @Transform(({ value }) => value.split(","))
  @IsEnum(KnownSupplementaryDataKey, { each: true })
  dataKeys: KnownSupplementaryDataKey[];
  @IsOptional()
  @IsPositive()
  applicationId?: number;
}

/**
 * Consolidated supplementary data for dynamic form submissions.
 * The keys of this object are dynamic based on the known supplementary
 * data keys requested by the client.
 */
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
