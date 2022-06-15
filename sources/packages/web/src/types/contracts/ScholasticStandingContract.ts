import { ScholasticStandingDataAPIInDTO } from "@/services/http/dto";

/**
 * Interface for study break item.
 */
export interface FormattedStudyBreak {
  breakStartDate: string;
  breakEndDate: string;
}

export interface ActiveApplicationData {
  applicationProgramName: string;
  applicationProgramDescription: string;
  applicationOfferingName: string;
  applicationOfferingIntensity: string;
  applicationOfferingStartDate: string;
  applicationOfferingEndDate: string;
  applicationStudentName: string;
  applicationNumber: string;
  applicationLocationName: string;
  applicationStatus: string;
  applicationOfferingStudyBreak: FormattedStudyBreak[];
}

export interface ScholasticStandingSubmittedDetails
  extends ScholasticStandingDataAPIInDTO,
    ActiveApplicationData {}
