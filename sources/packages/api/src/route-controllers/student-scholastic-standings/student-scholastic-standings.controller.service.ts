import { Injectable, NotFoundException } from "@nestjs/common";
import { StudentScholasticStandingsService } from "../../services";
import { ScholasticStandingSubmissionAPIOutDTO } from "./models/student-scholastic-standings.dto";
import {
  credentialTypeToDisplay,
  dateString,
  deliveryMethod,
  getUserFullName,
} from "../../utilities";

/**
 * Scholastic standing controller service.
 */
@Injectable()
export class ScholasticStandingControllerService {
  constructor(
    private readonly studentScholasticStandingsService: StudentScholasticStandingsService,
  ) {}

  /**
   * Get Scholastic Standing submission details.
   * @param scholasticStandingId scholastic standing id.
   * @returns Scholastic Standing.
   */

  async getScholasticStanding(
    scholasticStandingId: number,
  ): Promise<ScholasticStandingSubmissionAPIOutDTO> {
    const scholasticStanding =
      await this.studentScholasticStandingsService.getScholasticStanding(
        scholasticStandingId,
      );

    if (!scholasticStanding) {
      throw new NotFoundException(`Scholastic Standing not found.`);
    }

    const application = scholasticStanding.application;
    const offering = scholasticStanding.referenceOffering;

    return {
      ...scholasticStanding.submittedData,
      applicationStatus: application.applicationStatus,
      applicationNumber: application.applicationNumber,
      applicationOfferingIntensity: offering.offeringIntensity,
      applicationOfferingStartDate: dateString(offering.studyStartDate),
      applicationOfferingEndDate: dateString(offering.studyEndDate),
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
      applicationOfferingStudyBreak: offering.studyBreaks?.map(
        (studyBreak) => ({
          breakStartDate: dateString(studyBreak.breakStartDate),
          breakEndDate: dateString(studyBreak.breakEndDate),
        }),
      ),
      applicationOfferingTuition: offering.actualTuitionCosts,
      applicationOfferingProgramRelatedCosts: offering.programRelatedCosts,
      applicationOfferingMandatoryFess: offering.mandatoryFees,
      applicationOfferingExceptionalExpenses: offering.exceptionalExpenses,
    };
  }
}
