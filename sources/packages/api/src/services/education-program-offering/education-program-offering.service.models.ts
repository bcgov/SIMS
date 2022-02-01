import { OfferingIntensity, StudyBreak } from "../../database/entities";
import { ApprovalStatus } from "../education-program/constants";

export class EducationProgramOfferingModel {
  id: number;
  name: string;
  studyStartDate: Date;
  studyEndDate: Date;
  offeringDelivered: string;
  offeringIntensity: OfferingIntensity;
}
export class PaginatedOffering {
  offeringSummary: EducationProgramOfferingModel[];
  totalOfferings: number;
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
  locationId: number;
  programStatus: ApprovalStatus;
  offeringsCount: number;
  formattedSubmittedDate: string;
}
export class ProgramsOfferingSummaryPaginated {
  programsSummary: ProgramsOfferingSummary[];
  programsCount: number;
}

export class ProgramsSummary {
  programId: number;
  programName: string;
  submittedDate: Date;
  formattedSubmittedDate: string;
  locationName: string;
  locationId: number;
  programStatus: ApprovalStatus;
  offeringsCount: number;
}

export class ProgramsSummaryPaginated {
  programsSummary: ProgramsSummary[];
  programsCount: number;
}
