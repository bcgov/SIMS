import { Injectable, NotFoundException } from "@nestjs/common";
import { ApplicationOfferingChangeRequestService } from "../../services";
import {
  ApplicationOfferingChangesAPIOutDTO,
  ApplicationOfferingDetailsAPIOutDTO,
  ApplicationOfferingDetailsReviewAPIOutDTO,
} from "./models/application-offering-change-request.dto";
import { getUserFullName } from "../../utilities";

@Injectable()
export class ApplicationOfferingChangeRequestControllerService {
  constructor(
    private readonly applicationOfferingChangeRequestService: ApplicationOfferingChangeRequestService,
  ) {}

  /**
   * Get the Application Offering Change Request by its id for the ministry.
   * @param applicationOfferingChangeRequestId the Application Offering Change Request id.
   * @param options method options:
   * - `hasAuditAndNoteDetails`: boolean true indicates that only a certain required application offering details are requested.
   * @returns application offering change request.
   */
  async getApplicationOfferingChangeRequest(
    applicationOfferingChangeRequestId: number,
    options: {
      hasAuditAndNoteDetails: boolean;
    },
  ): Promise<ApplicationOfferingDetailsReviewAPIOutDTO>;

  /**
   * Get the Application Offering Change Request by its id for the institution.
   * @param applicationOfferingChangeRequestId the Application Offering Change Request id.
   * @param options method options:
   * - `locationId`: location id for institution authorization.
   * @returns application offering change request.
   */
  async getApplicationOfferingChangeRequest(
    applicationOfferingChangeRequestId: number,
    options: {
      locationId: number;
    },
  ): Promise<ApplicationOfferingChangesAPIOutDTO>;

  /**
   * Get the Application Offering Change Request by its id for the student.
   * @param applicationOfferingChangeRequestId the Application Offering Change Request id.
   * @param options method options:
   * - `studentId`: student id for student authorization.
   * - `applicationOfferingDetails`: boolean true indicates that only the required application offering details for the student are requested.
   * @returns application offering change request.
   */
  async getApplicationOfferingChangeRequest(
    applicationOfferingChangeRequestId: number,
    options: {
      studentId: number;
      applicationOfferingDetails: boolean;
    },
  ): Promise<ApplicationOfferingDetailsAPIOutDTO>;

  /**
   * Get the Application Offering Change Request by its id.
   * @param applicationOfferingChangeRequestId the Application Offering Change Request id.
   * @param options method options:
   * - `studentId`: student id for student authorization.
   * - `locationId`: location id for institution authorization.
   * - `applicationOfferingDetails`: boolean true indicates that the required application offering details for the institution are requested.
   * - `hasAuditAndNoteDetails`: boolean true indicates that the required application offering details for the ministry are requested.
   * @returns application offering change request.
   */
  async getApplicationOfferingChangeRequest(
    applicationOfferingChangeRequestId: number,
    options?: {
      studentId?: number;
      locationId?: number;
      applicationOfferingDetails?: boolean;
      hasAuditAndNoteDetails?: boolean;
    },
  ): Promise<
    | ApplicationOfferingChangesAPIOutDTO
    | ApplicationOfferingDetailsAPIOutDTO
    | ApplicationOfferingDetailsReviewAPIOutDTO
  > {
    const request = await this.applicationOfferingChangeRequestService.getById(
      applicationOfferingChangeRequestId,
      { studentId: options?.studentId, locationId: options?.locationId },
    );
    if (!request) {
      throw new NotFoundException(
        "Not able to find an Application Offering Change Request.",
      );
    }
    const applicationOfferingDetails = {
      status: request.applicationOfferingChangeRequestStatus,
      applicationNumber: request.application.applicationNumber,
      locationName: request.application.location.name,
      requestedOfferingId: request.requestedOffering.id,
      activeOfferingId: request.activeOffering.id,
      reason: request.reason,
    };
    if (options?.applicationOfferingDetails) {
      return applicationOfferingDetails;
    }
    if (options?.hasAuditAndNoteDetails) {
      return {
        ...applicationOfferingDetails,
        assessedNoteDescription: request.assessedNote?.description,
        studentFullName: getUserFullName(request.application.student.user),
        assessedDate: request.assessedDate,
        assessedBy: getUserFullName(request.assessedBy),
        institutionId: request.application.location.institution.id,
        institutionName: request.application.location.institution.operatingName,
        submittedDate: request.createdAt,
        updatedDate: request.updatedAt,
      };
    }
    return {
      ...applicationOfferingDetails,
      id: request.id,
      applicationId: request.application.id,
      requestedOfferingDescription: request.requestedOffering.name,
      requestedOfferingProgramId: request.requestedOffering.educationProgram.id,
      requestedOfferingProgramName:
        request.requestedOffering.educationProgram.name,
      assessedNoteDescription: request.assessedNote?.description,
      studentFullName: getUserFullName(request.application.student.user),
    };
  }
}
