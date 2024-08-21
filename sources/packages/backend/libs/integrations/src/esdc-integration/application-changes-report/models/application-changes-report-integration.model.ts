export interface ApplicationChangesReportProcessingResult {
  applicationsReported: number;
  uploadedFileName: string;
}

export enum ApplicationChangesReportHeaders {
  ApplicationNumber = "Application Number",
  StudentSIN = "Student SIN",
  StudentFirstName = "Student First Name",
  StudentLastName = "Student Last Name",
  LoanType = "Loan Type",
  EducationInstitutionCode = "Education Institution Code",
  OriginalStudyStartDate = "Original Study Start Date",
  OriginalStudyEndDate = "Original Study End Date",
  Activity = "Activity",
  ActivityTime = "Activity Time",
  NewStudyStartDate = "New Study Start Date",
  NewStudyEndDate = "New Study End Date",
}

export type ApplicationChangesReport = Record<
  ApplicationChangesReportHeaders,
  string
>;
export const APPLICATION_CHANGES_DATE_TIME_FORMAT = "YYYY-MM-DDTHH:mm:ss";
export const APPLICATION_CHANGES_FILE_NAME_TIMESTAMP_FORMAT =
  "YYYY-MM-DD.HH.mm.ss";
