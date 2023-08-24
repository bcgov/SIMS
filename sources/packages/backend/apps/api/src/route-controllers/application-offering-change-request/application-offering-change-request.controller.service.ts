import { Injectable, NotFoundException } from "@nestjs/common";
import { ApplicationOfferingChangeRequestService } from "../../services";
import {
  ApplicationOfferingChangesAPIOutDTO,
  ApplicationOfferingDetailsAPIOutDTO,
} from "./models/application-offering-change-request.dto";
import { getUserFullName } from "../../utilities";

@Injectable()
export class ApplicationOfferingChangeRequestControllerService {
  constructor(
    private readonly applicationOfferingChangeRequestService: ApplicationOfferingChangeRequestService,
  ) {}

  /**
   * Get the Application Offering Change Request by its id for the institution.
   * @param id the Application Offering Change Request id.
   * @param options method options:
   * - `locationId`: location id for institution authorization.
   * @returns application offering change request.
   */
  async getById(
    id: number,
    options?: {
      locationId?: number;
    },
  ): Promise<ApplicationOfferingChangesAPIOutDTO>;

  /**
   * Get the Application Offering Change Request by its id for the student.
   * @param id the Application Offering Change Request id.
   * @param options method options:
   * - `studentId`: student id for student authorization.
   * - `applicationOfferingDetails`: boolean true indicates that only the required application offering details for the student are requested.
   * @returns application offering change request.
   */
  async getById(
    id: number,
    options?: {
      studentId?: number;
      applicationOfferingDetails?: boolean;
    },
  ): Promise<ApplicationOfferingDetailsAPIOutDTO>;

  /**
   * Get the Application Offering Change Request by its id.
   * @param id the Application Offering Change Request id.
   * @param options method options:
   * - `studentId`: student id for student authorization.
   * - `locationId`: location id for institution authorization.
   * - `applicationOfferingDetails`: boolean true indicates that only the required application offering details for the student are requested.
   * @returns application offering change request.
   */
  async getById(
    id: number,
    options?: {
      studentId?: number;
      locationId?: number;
      applicationOfferingDetails?: boolean;
    },
  ): Promise<
    ApplicationOfferingChangesAPIOutDTO | ApplicationOfferingDetailsAPIOutDTO
  > {
    const request = await this.applicationOfferingChangeRequestService.getById(
      id,
      { studentId: options?.studentId, locationId: options?.locationId },
    );
    if (!request) {
      throw new NotFoundException(
        "Not able to find an Application Offering Change Request.",
      );
    }
    if (options?.applicationOfferingDetails) {
      return {
        status: request.applicationOfferingChangeRequestStatus,
        applicationNumber: request.application.applicationNumber,
        locationName: request.application.location.name,
        requestedOfferingId: request.requestedOffering.id,
        activeOfferingId: request.activeOffering.id,
        reason: request.reason,
      };
    }
    return {
      id: request.id,
      status: request.applicationOfferingChangeRequestStatus,
      applicationId: request.application.id,
      applicationNumber: request.application.applicationNumber,
      locationName: request.application.location.name,
      activeOfferingId: request.activeOffering.id,
      requestedOfferingId: request.requestedOffering.id,
      requestedOfferingDescription: request.requestedOffering.name,
      requestedOfferingProgramId: request.requestedOffering.educationProgram.id,
      requestedOfferingProgramName:
        request.requestedOffering.educationProgram.name,
      reason: request.reason,
      assessedNoteDescription: request.assessedNote?.description,
      studentFullName: getUserFullName(request.application.student.user),
    };
  }
}
