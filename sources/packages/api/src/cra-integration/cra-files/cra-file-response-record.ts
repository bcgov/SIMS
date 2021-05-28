import { MatchStatusCodes } from "../cra-integration.models";
import { CRARecordIdentification } from "./cra-file-response-record-id";

/**
 * CRA Response Record (Trans Sub Code - 0022).
 */
export class CRAResponseFileLine extends CRARecordIdentification {
  constructor(line: string) {
    super(line);
  }

  public getMatchStatusCode(): MatchStatusCodes {
    return super.line.substr(29, 2) as MatchStatusCodes;
  }
}
