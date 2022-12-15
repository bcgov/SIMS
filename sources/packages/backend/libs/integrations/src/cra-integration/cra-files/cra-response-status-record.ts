import {
  BirthDateStatusCode,
  GivenNameStatusCode,
  MatchStatusCodes,
  RequestStatusCodes,
  SINMatchStatusCodes,
  SurnameStatusCode,
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
 * Please note that the numbers below (e.g. line.substring(25, 2))
 * represents the position of the information in a fixed text file format.
 * The documentation about it is available on the document
 * 'Income Verification Data Exchange Technical Guide BC'.
 */
export class CRAResponseStatusRecord extends CRAResponseRecordIdentification {
  constructor(line: string, lineNumber: number) {
    super(line, lineNumber);
  }

  /**
   * Indicates if the request has been processed successfully.
   * Named as REQUEST-STATUS-CODE on CRA documentation.
   */
  public get requestStatusCode(): RequestStatusCodes {
    return this.line.substring(25, 27) as RequestStatusCodes;
  }

  /**
   * Indicates if the match is successful. 'The match' means that
   * when we send the first name, last name, DOB and SIN, CRA will
   * check if the personal information matches with its own data.
   * Named as MATCH-STATUS-CODE on CRA documentation.
   */
  public get matchStatusCode(): MatchStatusCodes {
    return this.line.substring(29, 31) as MatchStatusCodes;
  }

  /**
   * SIN match status codes (SIN-TTN-STATUS-CODE) presents on
   * CRA Response Record (Trans Sub Code - 0022).
   */
  public get sinMatchStatusCode(): SINMatchStatusCodes {
    return this.line.substring(31, 33) as SINMatchStatusCodes;
  }

  /**
   * GivenName match status codes (GIVEN-NAME-STATUS-CODE) presents on
   * CRA Response Record (Trans Sub Code - 0022).
   */
  public get surnameMatchStatusCode(): SurnameStatusCode {
    return this.line.substring(33, 35) as SurnameStatusCode;
  }

  /**
   * GivenName match status codes (GIVEN-NAME-STATUS-CODE) presents on
   * CRA Response Record (Trans Sub Code - 0022).
   */
  public get givenNameMatchStatusCode(): GivenNameStatusCode {
    return this.line.substring(35, 37) as GivenNameStatusCode;
  }

  /**
   * BirthDate match status codes (BIRTH-DATE-STATUS-CODE) presents on
   * CRA Response Record (Trans Sub Code - 0022).
   */
  public get birthDateMatchStatusCode(): BirthDateStatusCode {
    return this.line.substring(37, 39) as BirthDateStatusCode;
  }

  /**
   * This field will always have a value of "00" unless the client is
   * inactive with CRA. Examples of inactive could be the taxpayer is
   * deceased or emigrant.
   * Named as INACTIVE-CRA-INDIVIDUAL-CODE on CRA documentation.
   */
  public get inactiveCode(): MatchStatusCodes {
    return this.line.substring(39, 41) as MatchStatusCodes;
  }

  /**
   * Free text that could be used for any application specific purpose.
   * This text will be send to CRA on the request file and returned in
   * the same record on the response file.
   * Named as IV-RECORD-IDENTIFICATION-FIELD on CRA documentation.
   */
  public get freeProjectArea(): string {
    return this.line.substring(41, 71).trim();
  }
}
