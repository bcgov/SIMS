import {
  APPLICATION_ID,
  PROGRAM_INFO_STATUS,
} from "@sims/services/workflow/variables/assessment-gateway";
import { ProgramInfoStatus } from "@sims/sims-db";

export interface ProgramInfoRequestJobInDTO {
  [APPLICATION_ID]: number;
}

export interface ProgramInfoRequestJobHeaderDTO {
  programInfoStatus: ProgramInfoStatus;
}

export interface ProgramInfoRequestJobOutDTO {
  [PROGRAM_INFO_STATUS]: ProgramInfoStatus;
}
