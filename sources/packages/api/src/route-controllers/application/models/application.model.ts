export interface CreateApplicationDto {
  /**
   * Application dynamic data.
   */
  data: any;
  /**
   * Array of unique file names to be associated
   * with this application.
   */
  associatedFiles: string[];
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

export interface LocationsApplicationDTO {
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
  applicationNumberId: number;
  pirStatus: string;
  firstName: string;
  lastName: string;
}
