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

export interface ApplicationAssessmentDTO {
  /**
   * Assessment data for an Application
   */
  weeks: number;
  federal_assessment_need: number;
  provincial_assessment_need: number;
  total_federal_award: number;
  total_provincial_award: number;
}

export class ApplicationDto {
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
   * Assessment Values in an Application
   */
  assessment: any;
}