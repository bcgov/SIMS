import {
  MatchStatusCodes,
  RequestStatusCodes,
} from "../cra-integration.models";
import { CRAResponseRecordIdentification } from "./cra-response-record-identification";

/**
 * CRA Response Record (Trans Sub Code - 0022) that
 * contains validation statuses about the person data
 * (e.g. first name, last name, DOB, SIN) and
 * about the CRA tax files.
 * This record is part of the standard records
 * that comprise the response file, what means that it
 * will be present whatever there is a need from a SIN
 * validation or a complete income verification.
 */
export class CRAResponseStatusRecord extends CRAResponseRecordIdentification {
  constructor(line: string, lineNumber: number) {
    super(line, lineNumber);
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
