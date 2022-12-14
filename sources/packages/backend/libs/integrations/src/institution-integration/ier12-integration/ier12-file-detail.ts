import { DisbursementSchedule, DisbursementValue } from "@sims/sims-db";
import { END_OF_LINE, StringBuilder } from "@sims/utilities";
import {
  DATE_FORMAT,
  IER12FileLine,
  NUMBER_FILLER,
  SPACE_FILLER,
} from "./models/ier12-integration.model";

/**
 * Record of a IER12 file.
 * The documentation about it is available on the document
 * 'SIMSSFAS - Institution File layouts In Analysis Folder'.
 */
export class IER12FileDetail implements IER12FileLine {
  assessmentId: number;
  applicationNumber: string;
  sin: string;
  studentLastName: string;
  studentGivenName: string;
  birthDate: string;
  programName: string;
  programDescription: string;
  credentialType: string;
  cipCode: number;
  nocCode: string;
  sabcCode: string;
  institutionProgramCode: string;
  programLength: number;
  studyStartDate: string;
  studyEndDate: string;
  tuitionFees: number;
  programRelatedCosts: number;
  mandatoryFees: number;
  exceptionExpenses: number;
  totalFundedWeeks: number;
  disbursementSchedules: DisbursementSchedule[];

  getFixedFormat(): string {
    const records = this.disbursementSchedules.map((disbursement) => {
      const record = new StringBuilder();
      record.appendWithStartFiller(this.assessmentId, 10, NUMBER_FILLER);
      record.appendWithStartFiller(disbursement.id, 10, NUMBER_FILLER);
      record.appendWithStartFiller(this.applicationNumber, 10, NUMBER_FILLER);
      record.append(this.sin, 9);
      record.appendWithEndFiller(this.studentLastName, 25, SPACE_FILLER);
      record.appendWithEndFiller(this.studentGivenName ?? "", 15, SPACE_FILLER);
      record.appendDate(this.birthDate, DATE_FORMAT);
      record.appendWithEndFiller(this.programName, 25, SPACE_FILLER);
      record.appendWithEndFiller(this.programDescription, 50, SPACE_FILLER);
      record.appendWithEndFiller(this.credentialType, 25, SPACE_FILLER);
      record.append(this.cipCode.toString(), 6);
      record.append(this.nocCode, 4);
      record.appendWithEndFiller(this.sabcCode ?? "", 4, SPACE_FILLER);
      record.appendWithEndFiller(
        this.institutionProgramCode ?? "",
        25,
        SPACE_FILLER,
      );
      record.append(this.programLength.toString(), 1);
      record.appendDate(this.studyStartDate, DATE_FORMAT);
      record.appendDate(this.studyEndDate, DATE_FORMAT);
      record.appendWithStartFiller(
        this.tuitionFees.toString(),
        8,
        NUMBER_FILLER,
      );
      record.appendWithStartFiller(
        this.programRelatedCosts.toString(),
        8,
        NUMBER_FILLER,
      );
      record.appendWithStartFiller(
        this.mandatoryFees.toString(),
        8,
        NUMBER_FILLER,
      );
      record.appendWithStartFiller(
        this.exceptionExpenses.toString(),
        8,
        NUMBER_FILLER,
      );
      record.appendWithStartFiller(
        this.totalFundedWeeks.toString(),
        2,
        NUMBER_FILLER,
      );
      record.repeatAppend(SPACE_FILLER, 3); //We have hardcoded the courseLoad to null as its only for FullTime.
      record.append("F", 1); //This implementation is only for FullTime, so hardcoding it to F.
      record.appendWithEndFiller(
        disbursement.coeStatus ?? "",
        10,
        SPACE_FILLER,
      );
      record.appendWithEndFiller(
        disbursement.disbursementScheduleStatus ?? "",
        10,
        SPACE_FILLER,
      );
      record.appendDate(disbursement.disbursementDate, DATE_FORMAT);
      record.appendDate(disbursement.dateSent, DATE_FORMAT);
      disbursement.disbursementValues.map(
        (disbursementValue: DisbursementValue) => {
          record.append(disbursementValue.valueCode, 4);
          record.appendWithStartFiller(
            disbursementValue.valueAmount,
            8,
            NUMBER_FILLER,
          );
        },
      );
      return record.toString();
    });
    return records.join(END_OF_LINE);
  }
}
