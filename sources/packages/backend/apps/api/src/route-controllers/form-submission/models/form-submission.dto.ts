import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsDefined,
  IsOptional,
  IsPositive,
  ValidateNested,
} from "class-validator";
import { JsonMaxSize } from "../../../utilities/class-validation";
import { JSON_10KB } from "../../../constants";
import { Parent } from "../../../types";
import { FormSubmissionStatus } from "@sims/sims-db/entities";
import { FormCategory } from "@sims/sims-db";
import { FormSubmissionDecisionStatus } from "@sims/sims-db/entities/form-submission-decision-status.type";

class FormSubmissionItemAPIOutDTO {
  formType: string;
  decisionStatus: FormSubmissionDecisionStatus;
  decisionDate?: Date;
}

export class FormSubmissionAPIOutDTO {
  id: number;
  formCategory: FormCategory;
  status: FormSubmissionStatus;
  applicationId?: number;
  applicationNumber?: string;
  submittedDate: Date;
  assessedDate?: Date;
  submissionItems: FormSubmissionItemAPIOutDTO[];
}

export class FormSubmissionsAPIOutDTO {
  submissions: FormSubmissionAPIOutDTO[];
}

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
