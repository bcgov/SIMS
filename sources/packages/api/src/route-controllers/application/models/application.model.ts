export interface SaveApplicationDto {
  /**
   * Application dynamic data.
   */
  data: any;
  /**
   * Array of unique file names to be associated
   * with this application.
   */
  associatedFiles: string[];
  /**
   * Selected form of the application.
   * This will be used for ProgramYear active validation
   */
  programYearId: number;
}

export interface GetApplicationDataDto {
  /**
   * Application dynamic data.
   */
  data: any;
}

export interface StudentApplicationDTO {
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
  id: number;
  applicationName: string;
  award: string;
  status: string;
}

export interface PIRSummaryDTO {
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
  applicationId: number;
  pirStatus: string;
  firstName: string;
  lastName: string;
}

export interface COESummaryDTO {
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
  applicationId: number;
  coeStatus: string;
  firstName: string;
  lastName: string;
}
