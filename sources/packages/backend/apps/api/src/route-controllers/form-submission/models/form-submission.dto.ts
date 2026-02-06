import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { JsonMaxSize } from "../../../utilities/class-validation";
import { JSON_10KB } from "../../../constants";
import { Parent } from "../../../types";
import {
  FormSubmissionStatus,
  NOTE_DESCRIPTION_MAX_LENGTH,
} from "@sims/sims-db/entities";
import { FormCategory } from "@sims/sims-db";
import { FormSubmissionDecisionStatus } from "@sims/sims-db/entities/form-submission-decision-status.type";

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

// Submission summary (history).

export class FormSubmissionStudentSummaryAPIOutDTO {
  submissions: FormSubmissionStudentAPIOutDTO[];
}

export class FormSubmissionMinistrySummaryAPIOutDTO {
  submissions: FormSubmissionMinistryAPIOutDTO[];
}

// Get submission and items.

class FormSubmissionItemMinistryAPIOutDTO extends FormSubmissionItemAPIOutDTO {
  decisionNoteDescription?: string;
}

export class FormSubmissionMinistryAPIOutDTO extends FormSubmissionAPIOutDTO {
  submissionItems: FormSubmissionItemMinistryAPIOutDTO[];
}

class FormSubmissionItemStudentAPIOutDTO extends FormSubmissionItemAPIOutDTO {}

export class FormSubmissionStudentAPIOutDTO extends FormSubmissionAPIOutDTO {
  submissionItems: FormSubmissionItemStudentAPIOutDTO[];
}

// Student submission.

export class FormSubmissionItemAPIInDTO {
  @IsPositive()
  dynamicConfigurationId: number;
  @IsDefined()
  @JsonMaxSize(JSON_10KB)
  formData: {
    programYear?: string;
    parents?: Parent[];
  } & Record<string, unknown>;
  @IsDefined()
  files: string[];
}

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

// Ministry submission.

export class FormSubmissionItemDecisionAPIInDTO {
  @IsEnum(FormSubmissionDecisionStatus)
  decisionStatus: FormSubmissionDecisionStatus;
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  noteDescription: string;
}
