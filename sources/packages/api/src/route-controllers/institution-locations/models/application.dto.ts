import {
  credentialTypeToDisplay,
  dateString,
  deliveryMethod,
  getUserFullName,
} from "../../../utilities";
import {
  Application,
  ApplicationStatus,
  EducationProgramOffering,
  StudyBreak,
} from "../../../database/entities";

export class ActiveApplicationDataAPIOutDTO {
  applicationProgramName: string;
  applicationProgramDescription: string;
  applicationOfferingName: string;
  applicationOfferingIntensity: string;
  applicationOfferingStartDate: Date;
  applicationOfferingEndDate: Date;
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

/**
 * Transformation util for Active application.
 * @param application application object.
 * @param offering offering object.
 * @returns active application data dto.
 */
export const transformToActiveApplicationDataAPIOutDTO = (
  application: Application,
  offering: EducationProgramOffering,
): ActiveApplicationDataAPIOutDTO => {
  return {
    applicationStatus: application.applicationStatus,
    applicationNumber: application.applicationNumber,
    applicationOfferingIntensity: offering.offeringIntensity,
    applicationOfferingStartDate: offering.studyStartDate,
    applicationOfferingEndDate: offering.studyEndDate,
    applicationLocationName: offering.institutionLocation.name,
    applicationStudentName: getUserFullName(application.student.user),
    applicationOfferingName: offering.name,
    applicationProgramDescription: offering.educationProgram.description,
    applicationProgramName: offering.educationProgram.name,
    applicationProgramCredential: credentialTypeToDisplay(
      offering.educationProgram.credentialType,
    ),
    applicationProgramDelivery: deliveryMethod(
      offering.educationProgram.deliveredOnline,
      offering.educationProgram.deliveredOnSite,
    ),
    applicationOfferingStudyDelivery: offering.offeringDelivered,
    applicationOfferingStudyBreak: offering.studyBreaks?.map((studyBreak) => ({
      breakStartDate: studyBreak.breakStartDate,
      breakEndDate: studyBreak.breakEndDate,
    })),
    applicationOfferingTuition: offering.actualTuitionCosts,
    applicationOfferingProgramRelatedCosts: offering.programRelatedCosts,
    applicationOfferingMandatoryFess: offering.mandatoryFees,
    applicationOfferingExceptionalExpenses: offering.exceptionalExpenses,
  };
};
