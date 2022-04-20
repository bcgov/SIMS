import { ApplicationStatus } from "../../../database/entities";
import { StudyBreak } from "../../confirmation-of-enrollment/models/confirmation-of-enrollment.model";

export class ActiveApplicationDataAPIOutDTO {
  applicationProgramName: string;
  applicationProgramDescription: string;
  applicationOfferingName: string;
  applicationOfferingIntensity: string;
  applicationOfferingStartDate: string;
  applicationOfferingEndDate: string;
  applicationStudentName: string;
  applicationNumber: string;
  applicationLocationName: string;
  applicationStatus: ApplicationStatus;
  applicationProgramCredential: string;
  applicationProgramDelivery: string;
  applicationOfferingStudyDelivery: string;
  applicationOfferingStudyBreak: StudyBreak[];
  applicationOfferingTuition: number;
  applicationOfferingProgramRelatedCosts: number;
  applicationOfferingMandatoryFess: number;
  applicationOfferingExceptionalExpenses: number;
}

export class ActiveApplicationSummaryAPIOutDTO {
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
  applicationId: number;
  applicationStatus: ApplicationStatus;
  fullName: string;
}
