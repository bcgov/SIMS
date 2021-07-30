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
  id: number;
  pirStatus: string;
  firstName: string;
  lastName: string;
}

export interface LocationApplications {
  first_name: string;
  last_name: string;
  application_number: string;
  id: number;
  study_start_date: string;
  study_end_date: string;
  pir_status: string;
}
