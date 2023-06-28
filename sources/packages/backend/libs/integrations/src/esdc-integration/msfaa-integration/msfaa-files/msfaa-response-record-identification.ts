import { OfferingIntensity } from "@sims/sims-db";
import {
  RecordTypeCodes,
  ReceivedStatusCode,
} from "../models/msfaa-integration.model";

export class MSFAAResponseRecordIdentification {
  constructor(line: string, lineNumber: number) {
    this.transactionCode = line.substring(0, 3) as RecordTypeCodes;
    this.msfaaNumber = line.substring(3, 13);
    this.sin = line.substring(13, 22);
    this.statusCode = line.substring(22, 23) as ReceivedStatusCode;
    this.offeringIntensity =
      line.substring(39, 41) === "PT"
        ? OfferingIntensity.partTime
        : OfferingIntensity.fullTime;
    this.line = line;
    this.lineNumber = lineNumber;
  }

  /**
   * Codes used to start all the lines of the files sent to MSFAA.
   */
  public readonly transactionCode: RecordTypeCodes;
  /**
   * MSFAA number of the record.
   */
  public readonly msfaaNumber: string;
  /**
   * SIN value that is part of the common record identification.
   */
  public readonly sin: string;
  /**
   * Status codes used alongside the records.
   */
  public readonly statusCode: ReceivedStatusCode;
  /**
   * Offering Intensity associated with the MSFAA record.
   */
  public readonly offeringIntensity: OfferingIntensity;
  /**
   * Original line read from the MSFAA response file.
   */
  public readonly line: string;
  /**
   * Original line number where this record was present
   * in the MSFAA response file. Useful for log.
   */
  public readonly lineNumber: number;
}
