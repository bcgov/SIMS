import { DisbursementSchedule, DisbursementValue } from "@sims/sims-db";
import {
  DATE_FORMAT,
  SPACE_FILLER,
} from "../../cra-integration/cra-integration.models";
import { StringBuilder } from "../../utilities";
import { IERRequestFileLine } from "./models/ier-integration.model";

/**
 * Record of a IER request file.
 * The documentation about it is available on the document
 * 'SIMSSFAS - Institution File layouts In Analysis Folder'.
 */
export class IERFileDetail implements IERRequestFileLine {
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
  courseLoad: number;
  offeringIntensity: string;
  disbursementSchedules: DisbursementSchedule[];

  public getFixedFormat(): string {
    const grantType = this.disbursementSchedules.map(
      (disbursementSchedule: DisbursementSchedule) => {
        const disbursementValues: DisbursementValue[] = Object.values(
          disbursementSchedule.disbursementValues.reduce(
            (disbursementValue, { valueCode, valueAmount }) => {
              disbursementValue[valueCode] = {
                valueCode,
                valueAmount:
                  (disbursementValue[valueCode]
                    ? parseInt(disbursementValue[valueCode].valueAmount)
                    : 0) + valueAmount,
              };
              return disbursementValue;
            },
            {},
          ),
        );
        return disbursementValues;
      },
    );
    const record = new StringBuilder();
    record.appendWithStartFiller(this.assessmentId, 10, "0");
    record.append(this.applicationNumber, 10);
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
    record.append(this.tuitionFees.toString(), 8);
    record.append(this.programRelatedCosts.toString(), 8);
    record.append(this.mandatoryFees.toString(), 8);
    record.append(this.exceptionExpenses.toString(), 8);
    record.append(this.totalFundedWeeks.toString(), 2);
    record.appendWithEndFiller(
      this.courseLoad ? this.courseLoad.toString() : "",
      3,
      SPACE_FILLER,
    );
    record.append(this.offeringIntensity, 1);
    return record.toString();
  }
}
