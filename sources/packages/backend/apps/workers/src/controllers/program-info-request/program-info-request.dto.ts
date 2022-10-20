import {
  APPLICATION_ID,
  PROGRAM_INFO_STATUS,
  SELECTED_LOCATION,
  SELECTED_PROGRAM,
} from "@sims/services/workflow/variables/assessment-gateway";
import { ProgramInfoStatus } from "@sims/sims-db";

export interface ProgramInfoRequestJobInDTO {
  [APPLICATION_ID]: number;
  [SELECTED_LOCATION]: number;
  [SELECTED_PROGRAM]?: number;
}

export interface ProgramInfoRequestJobHeaderDTO {
  programInfoStatus: ProgramInfoStatus;
}

export interface ProgramInfoRequestJobOutDTO {
  [PROGRAM_INFO_STATUS]: ProgramInfoStatus;
}
