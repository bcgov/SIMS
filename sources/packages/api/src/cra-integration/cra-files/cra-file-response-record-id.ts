import {
  TransactionCodes,
  TransactionSubCodes,
} from "../cra-integration.models";

/**
 * Common identification info for a CRA response file record.
 */
export class CRARecordIdentification {
  constructor(line: string) {
    this.transactionCode = line.substr(0, 4) as TransactionCodes;
    this.sin = line.substr(4, 9);
    this.transactionSubCode = line.substr(17, 4) as TransactionSubCodes;
    this.line = line;
  }

  public readonly transactionCode: TransactionCodes;
  public readonly sin: string;
  public readonly transactionSubCode: TransactionSubCodes;
  public readonly line: string;
}
