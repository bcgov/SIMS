import * as dayjs from "dayjs";
import { OfferingIntensity } from "../../database/entities/offering-intensity.type";
import { StudyBreak } from "../../database/entities/education-program-offering.model";
import { EXTENDED_DATE_FORMAT } from "../../utilities";

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
  yearOfStudy: number;
  showYearOfStudy?: boolean;
  hasOfferingWILComponent: string;
  offeringWILType?: string;
  studyBreaks?: StudyBreak[];
  offeringDeclaration: boolean;
}

export class ProgramsOfferingSummary {
  programId: number;
  programName: string;
  submittedDate: Date;
  locationName: string;
  programStatus: string;
  offeringsCount: number;
}
export class ProgramsOfferingSummaryPaginated {
  programsSummary: ProgramsOfferingSummary[];
  programsCount: number;
}
