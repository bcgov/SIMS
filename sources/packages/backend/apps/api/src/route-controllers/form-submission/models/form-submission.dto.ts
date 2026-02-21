import {
  FormCategory,
  FormSubmissionDecisionStatus,
  FormSubmissionStatus,
  NOTE_DESCRIPTION_MAX_LENGTH,
} from "@sims/sims-db";
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
  IsNotEmpty,
  MaxLength,
  IsDate,
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

// Base classes for submission DTOs and submission items.

abstract class FormSubmissionAPIOutDTO {
  id: number;
  formCategory: FormCategory;
  status: FormSubmissionStatus;
  applicationId?: number;
  applicationNumber?: string;
  submittedDate: Date;
  assessedDate?: Date;
}

abstract class FormSubmissionItemAPIOutDTO {
  formType: string;
  formCategory: FormCategory;
  decisionStatus: FormSubmissionDecisionStatus;
  decisionDate?: Date;
  dynamicFormConfigurationId: number;
  submissionData: unknown;
  formDefinitionName: string;
}

export class FormSubmissionConfigurationsAPIOutDTO {
  configurations: FormSubmissionConfigurationAPIOutDTO[];
}

class FormSubmissionItemMinistryAPIOutDTO extends FormSubmissionItemAPIOutDTO {
  decisionBy: string;
  decisionNoteDescription?: string;
}

export class FormSubmissionMinistryAPIOutDTO extends FormSubmissionAPIOutDTO {
  submissionItems: FormSubmissionItemMinistryAPIOutDTO[];
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
 * Student individual form item in the form submission.
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
 * Student form submission with one to many form items for individual Ministry decision.
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

/**
 * Ministry individual form item decision update.
 */
export class FormSubmissionItemDecisionAPIInDTO {
  @IsEnum(FormSubmissionDecisionStatus)
  decisionStatus: FormSubmissionDecisionStatus;
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  noteDescription: string;
  /**
   * Date when the decision was made for the last time, used for
   * concurrency control to prevent overwriting a more recent decision.
   */
  @IsOptional()
  @IsDate()
  lastUpdatedDate?: Date;
}

/**
 * Ministry individual form item decision update result.
 */
export class FormSubmissionItemDecisionAPIOutDTO {
  decisionBy: string;
  decisionDate: Date;
}
