import { ProgramInfoStatus } from "@sims/sims-db";

export class ProgramInfoRequestWorkersInDTO {
  applicationId: number;
}

export class ProgramInfoRequestHeadersDTO {
  programInfoStatus: ProgramInfoStatus;
}

export class ProgramInfoRequestWorkersOutDTO {
  programInfoStatus: ProgramInfoStatus;
}
