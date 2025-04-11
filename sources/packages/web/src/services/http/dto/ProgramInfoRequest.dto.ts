import {
  CourseDetails,
  OfferingIntensity,
  OfferingTypes,
  ProgramInfoStatus,
  FieldSortOrder,
} from "@/types";
import { Expose } from "class-transformer";

export class CompleteProgramInfoRequestAPIInDTO {
  @Expose()
  selectedOffering: number;
}

export interface ProgramInfoRequestAPIOutDTO {
  institutionLocationName: string;
  applicationNumber: string;
  studentFullName: string;
  studentSelectedProgram: string;
  selectedProgram?: number;
  selectedOffering?: number;
  pirStatus: ProgramInfoStatus;
  studentCustomProgram: string;
  studentCustomProgramDescription: string;
  studentStudyStartDate: string;
  studentStudyEndDate: string;
  offeringIntensitySelectedByStudent: OfferingIntensity;
  programYearId: number;
  isActiveProgram?: boolean;
  isExpiredProgram?: boolean;
  isActiveProgramYear: boolean;
  offeringName: string;
  offeringDelivered: string;
  offeringType: OfferingTypes;
  offeringIntensity: OfferingIntensity;
  courseDetails?: CourseDetails[];
  pirDenyReasonId?: number;
  otherReasonDesc?: string;
  isReadOnlyUser?: boolean;
}

export interface PIRDeniedReasonAPIOutDTO {
  id: number;
  description: string;
}

export interface PIRSearchCriteria {
  page: number;
  pageLimit: number;
  sortField?: string;
  sortOrder?: FieldSortOrder;
  search?: string;
  intensityFilter?: OfferingIntensity;
}

export class PIRSummaryAPIInDTO {
  @Expose()
  search?: string;

  @Expose()
  intensityFilter?: OfferingIntensity;

  @Expose()
  page: number;

  @Expose()
  pageLimit: number;

  @Expose()
  sortField?: string;

  @Expose()
  sortOrder?: FieldSortOrder;
}

export interface PIRSummaryAPIOutDTO {
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
  applicationId: number;
  pirStatus: ProgramInfoStatus;
  fullName: string;
  submittedDate: string;
  givenNames: string;
  lastName: string;
  studentNumber: string;
  studyIntensity: OfferingIntensity;
  program: string;
  applicationData?: {
    programName?: string;
    startDate?: string;
    endDate?: string;
  };
  offeringData?: {
    programName?: string;
    startDate?: string;
    endDate?: string;
  };
}

export class DenyProgramInfoRequestAPIInDTO {
  @Expose()
  pirDenyReasonId: number;
  @Expose()
  otherReasonDesc?: string;
}
