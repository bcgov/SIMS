import { Injectable } from "@nestjs/common";
import {
  ApplicationStatus,
  DisbursementSchedule,
  RestrictionActionType,
} from "@sims/sims-db";
import { ApplicationEventCode } from "../models/ier12-integration.model";
import {
  ApplicationEventCodeDuringAssessmentUtilsService,
  ApplicationEventCodeDuringEnrolmentAndCompletedUtilsService,
} from ".";

@Injectable()
export class ApplicationEventCodeUtilsService {
  constructor(
    private readonly applicationEventCodeDuringAssessmentUtilsService: ApplicationEventCodeDuringAssessmentUtilsService,
    private readonly applicationEventCodeDuringEnrolmentAndCompletedUtilsService: ApplicationEventCodeDuringEnrolmentAndCompletedUtilsService,
  ) {}

  /**
   * Get application event code (i.e current state of an application)
   * @param applicationNumber application number.
   * @param applicationStatus application status.
   * @param currentDisbursementSchedule current disbursement schedule.
   * @param activeRestrictionsActionTypes action types for active student restrictions.
   * @returns application event code.
   */
  async getApplicationEventCode(
    applicationNumber: string,
    applicationStatus: ApplicationStatus,
    currentDisbursementSchedule: Pick<
      DisbursementSchedule,
      "id" | "coeStatus" | "disbursementDate" | "disbursementScheduleStatus"
    >,
    activeRestrictionsActionTypes?: RestrictionActionType[][],
  ): Promise<ApplicationEventCode> {
    switch (applicationStatus) {
      case ApplicationStatus.Assessment:
        return this.applicationEventCodeDuringAssessmentUtilsService.applicationEventCodeDuringAssessment(
          applicationNumber,
        );
      case ApplicationStatus.Enrolment:
        return this.applicationEventCodeDuringEnrolmentAndCompletedUtilsService.applicationEventCodeDuringEnrolmentAndCompleted(
          currentDisbursementSchedule.coeStatus,
        );
      case ApplicationStatus.Completed:
        return this.applicationEventCodeDuringEnrolmentAndCompletedUtilsService.applicationEventCodeDuringCompleted(
          currentDisbursementSchedule,
          activeRestrictionsActionTypes,
        );
      case ApplicationStatus.Cancelled:
        return ApplicationEventCode.DISC;
    }
  }
}
