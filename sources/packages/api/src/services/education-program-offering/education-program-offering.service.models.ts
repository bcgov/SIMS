import * as dayjs from "dayjs";
import { EXTENDED_DATE_FORMAT } from "../../utilities/constants";
import { ValidIntensity } from "../../database/entities/valid-intensity.type";

export class EducationProgramOfferingModel {
  id: number;
  name: string;
  studyStartDate: Date;
  studyEndDate: Date;
  offeringDelivered: string;
  validIntensity: ValidIntensity;
  get studyDates(): string {
    if (this.studyStartDate === null) {
      return "No program dates";
    } else {
      return `${dayjs(this.studyStartDate).format(
        EXTENDED_DATE_FORMAT,
      )} - ${dayjs(this.studyEndDate).format(EXTENDED_DATE_FORMAT)}`;
    }
  }
}

export interface ProgramOfferingModel {
  id: number;
  name: string;
  studyStartDate: Date;
  studyEndDate: Date;
  breakStartDate: Date;
  breakEndDate: Date;
  actualTuitionCosts: number;
  programRelatedCosts: number;
  mandatoryFees: number;
  exceptionalExpenses: number;
  tuitionRemittanceRequestedAmount: number;
  offeringDelivered: string;
  lacksStudyDates: boolean;
  lacksStudyBreaks: boolean;
  lacksFixedCosts: boolean;
  tuitionRemittanceRequested: string;
  validIntensity: ValidIntensity;
}
