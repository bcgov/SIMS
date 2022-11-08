import { DisbursementSchedule, DisbursementValue } from "@sims/sims-db";
import {
  BCAG,
  BCSG,
  BCSL,
  BGPD,
  CSGD,
  CSGF,
  CSGP,
  CSGT,
  CSLF,
  SBSD,
} from "../../constants";
import {
  DATE_FORMAT,
  NUMBER_FILLER,
  SPACE_FILLER,
} from "../../cra-integration/cra-integration.models";
import { round, StringBuilder } from "../../utilities";
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
  totalGrant: DisbursementValue[];

  public getFixedFormat(): string {
    const grantType = Object.values(
      this.disbursementSchedules.reduce(
        (previousDisbursementschedule, { disbursementValues }) => {
          previousDisbursementschedule.disbursementValues = Object.values(
            [
              ...previousDisbursementschedule.disbursementValues,
              ...disbursementValues,
            ].reduce((disbursementValue, { valueCode, valueAmount }) => {
              disbursementValue[valueCode] = {
                valueCode,
                valueAmount:
                  (disbursementValue[valueCode]
                    ? round(parseInt(disbursementValue[valueCode].valueAmount))
                    : 0) + round(parseInt(valueAmount)),
              };
              return disbursementValue;
            }, {}),
          );
          return previousDisbursementschedule;
        },
      ),
    );
    this.totalGrant = grantType[1];
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
    record.appendWithStartFiller(this.populateGrants(CSLF), 8, NUMBER_FILLER);
    record.appendWithStartFiller(this.populateGrants(CSGP), 8, NUMBER_FILLER);
    record.appendWithStartFiller(this.populateGrants(CSGD), 8, NUMBER_FILLER);
    record.appendWithStartFiller(this.populateGrants(CSGF), 8, NUMBER_FILLER);
    record.appendWithStartFiller(this.populateGrants(CSGT), 8, NUMBER_FILLER);
    record.appendWithStartFiller(this.populateGrants(BCSL), 8, NUMBER_FILLER);
    record.appendWithStartFiller(this.populateGrants(BCAG), 8, NUMBER_FILLER);
    record.appendWithStartFiller(this.populateGrants(BGPD), 8, NUMBER_FILLER);
    record.appendWithStartFiller(this.populateGrants(SBSD), 8, NUMBER_FILLER);
    record.appendWithStartFiller(this.populateGrants(BCSG), 8, NUMBER_FILLER);
    return record.toString();
  }

  private populateGrants(valueCode: string) {
    return this.totalGrant.find(
      (disbursementValue) => (disbursementValue.valueCode = valueCode),
    ).valueAmount;
  }
}
