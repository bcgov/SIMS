import { DisbursementValue } from "@sims/sims-db";
import { END_OF_LINE, round, StringBuilder } from "@sims/utilities";
import {
  DATE_FORMAT,
  ECERequestFileLine,
  NUMBER_FILLER,
  RecordTypeCodes,
  SPACE_FILLER,
} from "../models/ece-integration.model";

/**
 * Record of a ECE request file.
 * The documentation about it is available on the document
 * 'SIMSSFAS - Institution File layouts In Analysis Folder'.
 */
export class ECERequestFileDetail implements ECERequestFileLine {
  transactionCode: RecordTypeCodes;
  institutionCode: string;
  awardDisbursmentIdx: string;
  disbursementValues: DisbursementValue[];
  sin: string;
  studentLastName: string;
  studentGivenName: string;
  birthDate: string;
  sfasApplicationNumber: string;
  institutionStudentNumber: string;
  courseLoad: string;
  studyStartDate: string;
  studyEndDate: string;
  disbursementDate: string;

  getFixedFormat(): string {
    const records = this.disbursementValues.map((disbursementValue) => {
      const record = new StringBuilder();
      record.append(this.transactionCode, 1);
      record.append(this.institutionCode, 4);
      record.appendWithEndFiller(
        this.awardDisbursmentIdx ?? "",
        10,
        SPACE_FILLER,
      );
      record.append(disbursementValue.valueCode, 4);
      record.appendWithStartFiller(
        round(disbursementValue.valueAmount),
        9,
        NUMBER_FILLER,
      );
      record.append(this.sin, 9);
      record.appendWithEndFiller(this.studentLastName, 25, SPACE_FILLER);
      record.appendWithEndFiller(this.studentGivenName ?? "", 15, SPACE_FILLER);
      record.appendDate(this.birthDate, DATE_FORMAT);
      record.append(this.sfasApplicationNumber, 10);
      record.appendWithEndFiller(
        this.institutionStudentNumber,
        12,
        SPACE_FILLER,
      );
      record.appendWithStartFiller(this.courseLoad ?? 100, 3, NUMBER_FILLER);
      record.appendDate(this.studyStartDate, DATE_FORMAT);
      record.appendDate(this.studyEndDate, DATE_FORMAT);
      record.appendDate(this.disbursementDate, DATE_FORMAT);
      return record.toString();
    });
    return records.join(END_OF_LINE);
  }
}
