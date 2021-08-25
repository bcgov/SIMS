import * as dayjs from "dayjs";
import { OfferingIntensity } from "../../database/entities/offering-intensity.type";

import { constants } from "../../utilities";
const { EXTENDED_DATE_FORMAT } = constants();

export class EducationProgramOfferingModel {
  id: number;
  name: string;
  studyStartDate: Date;
  studyEndDate: Date;
  offeringDelivered: string;
  offeringIntensity: OfferingIntensity;
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
  offeringIntensity: OfferingIntensity;
}
