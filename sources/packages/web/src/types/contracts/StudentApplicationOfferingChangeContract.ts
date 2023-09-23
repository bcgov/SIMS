import { ApplicationOfferingChangeRequestStatus } from "./ApplicationOfferingChangeRequestStatus";

export interface ApplicationOfferingDetails {
  studentName: string;
  applicationNumber: string;
  locationName: string;
  reasonForChange: string;
  accessedNoteDescription: string;
  applicationOfferingChangeRequestStatus: ApplicationOfferingChangeRequestStatus;
}
