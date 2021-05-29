import {
  MatchStatusCodes,
  RequestStatusCodes,
} from "../cra-integration.models";
import { CRARecordIdentification } from "./cra-file-response-record-id";

/**
 * CRA Response Record (Trans Sub Code - 0022).
 */
export class CRAResponseFileLine extends CRARecordIdentification {
  constructor(line: string) {
    super(line);
  }

  public get requestStatusCode(): RequestStatusCodes {
    return this.line.substr(25, 2) as RequestStatusCodes;
  }

  public get matchStatusCode(): MatchStatusCodes {
    return this.line.substr(29, 2) as MatchStatusCodes;
  }

  public get freeProjectArea(): string {
    return this.line.substr(41, 30).trim();
  }
}
