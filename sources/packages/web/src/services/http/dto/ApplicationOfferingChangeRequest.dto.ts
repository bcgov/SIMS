import { ApplicationOfferingChangeRequestStatus } from "@/types";

/**
 * Eligible applications offering change list details.
 */
export interface ApplicationOfferingChangeSummaryAPIOutDTO {
  applicationNumber: string;
  applicationId: number;
  studyStartPeriod: string;
  studyEndPeriod: string;
  fullName: string;
}

/**
 * Application offering change list.
 */
export interface ApplicationOfferingChangeAPIOutDTO {
  applicationNumber: string;
  applicationId: number;
  studyStartPeriod: string;
  studyEndPeriod: string;
  fullName: string;
  status: ApplicationOfferingChangeRequestStatus;
}
