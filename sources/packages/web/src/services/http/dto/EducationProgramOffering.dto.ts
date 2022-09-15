import { OfferingIntensity, OfferingStatus, OfferingTypes } from "@/types";

/**
 * Payload DTO to assess an offering.
 */
export interface OfferingAssessmentAPIInDTO {
  offeringStatus: OfferingStatus;
  assessmentNotes: string;
}

/**
 * DTO to display offering which is requested for change.
 */
export interface OfferingChangeRequestAPIOutDTO {
  offeringId: number;
  programId: number;
  offeringName: string;
  institutionName: string;
  locationName: string;
  submittedDate: Date;
}

/**
 * DTO to display the summary of preceding offering details.
 */
export interface PrecedingOfferingSummaryAPIOutDTO {
  applicationsCount: number;
}

export interface OfferingChangeAssessmentAPIInDTO {
  offeringStatus: OfferingStatus;
  assessmentNotes: string;
}

export interface StudyBreakOutDTO {
  breakStartDate: Date;
  breakEndDate: Date;
}

export interface StudyBreakInDTO {
  breakStartDate: Date;
  breakEndDate: Date;
}

export interface StudyBreaksAndWeeksOutDTO {
  studyBreaks: StudyBreakOutDTO[];
  fundedStudyPeriodDays: number;
  totalDays: number;
  totalFundedWeeks: number;
  unfundedStudyPeriodDays: number;
}

export interface StudyBreaksAndWeeksInDTO {
  studyBreaks: StudyBreakInDTO[];
  fundedStudyPeriodDays: number;
  totalDays: number;
  totalFundedWeeks: number;
  unfundedStudyPeriodDays: number;
}

export interface EducationProgramOfferingAPIInDTO {
  offeringName: string;
  studyStartDate: Date;
  studyEndDate: Date;
  actualTuitionCosts: number;
  programRelatedCosts: number;
  mandatoryFees: number;
  exceptionalExpenses: number;
  offeringDelivered: string;
  lacksStudyBreaks: boolean;
  offeringIntensity: OfferingIntensity;
  yearOfStudy: number;
  hasOfferingWILComponent: string;
  offeringDeclaration: boolean;
  offeringStatus: OfferingStatus;
  offeringType: OfferingTypes;
  offeringWILType?: string;
  showYearOfStudy?: boolean;
  breaksAndWeeks?: StudyBreaksAndWeeksInDTO;
  assessedBy?: string;
  assessedDate?: Date;
  courseLoad?: number;
}

export interface EducationProgramOfferingAPIOutDTO {
  id: number;
  offeringName: string;
  studyStartDate: string;
  studyEndDate: string;
  actualTuitionCosts: number;
  programRelatedCosts: number;
  mandatoryFees: number;
  exceptionalExpenses: number;
  offeringDelivered: string;
  lacksStudyBreaks: boolean;
  offeringIntensity: OfferingIntensity;
  yearOfStudy: number;
  hasOfferingWILComponent: string;
  offeringDeclaration: boolean;
  offeringStatus: OfferingStatus;
  offeringType: OfferingTypes;
  offeringWILType?: string;
  showYearOfStudy?: boolean;
  breaksAndWeeks?: StudyBreaksAndWeeksInDTO;
  assessedBy?: string;
  assessedDate?: Date;
  submittedDate: Date;
  courseLoad?: number;
  hasExistingApplication?: boolean;
  locationName?: string;
  institutionName?: string;
}

export interface EducationProgramOfferingSummaryAPIOutDTO {
  id: number;
  name: string;
  studyStartDate: string;
  studyEndDate: string;
  offeringDelivered: string;
  offeringIntensity: OfferingIntensity;
  offeringType: OfferingTypes;
  offeringStatus: OfferingStatus;
}

export interface OfferingStartDateAPIOutDTO {
  studyStartDate: Date;
}

/**
 * Represents the possible errors that can happen during the
 * offerings bulk insert and provides a detailed description
 * for every record that has an error.
 */
export interface OfferingBulkInsertValidationResultAPIOutDTO {
  recordIndex: number;
  locationCode?: string;
  sabcProgramCode?: string;
  startDate?: string;
  endDate?: string;
  offeringStatus?: OfferingStatus.Approved | OfferingStatus.CreationPending;
  errors: string[];
  warnings: ValidationWarningResultAPIOutDTO[];
}

/**
 * Represents an error considered not critical for
 * an offering and provides a user-friendly message
 * and a type that uniquely identifies this warning.
 */
export interface ValidationWarningResultAPIOutDTO {
  warningType: string;
  warningMessage: string;
}
