import { ApplicationOfferingChangeRequestStatus } from "./ApplicationOfferingChangeRequestStatus";

export interface ApplicationOfferingChangeRequestHeader {
  institutionId: number;
  institutionName: string;
  submittedDate: string;
  status: ApplicationOfferingChangeRequestStatus;
  assessedBy: string;
  assessedDate: string;
  locationName: string;
  studentActionDate?: string;
}
