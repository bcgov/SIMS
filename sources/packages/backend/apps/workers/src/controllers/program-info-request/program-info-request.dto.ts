import { ProgramInfoStatus } from "@sims/sims-db";

export interface ProgramInfoRequestJobInDTO {
  applicationId: number;
}

export interface ProgramInfoRequestJobHeaderDTO {
  programInfoStatus: ProgramInfoStatus;
}

export interface ProgramInfoRequestJobOutDTO {
  programInfoStatus: ProgramInfoStatus;
}
