import { Injectable, NotFoundException } from "@nestjs/common";
import { ApplicationOfferingChangeRequestService } from "../../services";
import { ApplicationOfferingChangesAPIOutDTO } from "./models/application-offering-change-request.dto";
import { getUserFullName } from "../../utilities";

@Injectable()
export class ApplicationOfferingChangeRequestControllerService {
  constructor(
    private readonly applicationOfferingChangeRequestService: ApplicationOfferingChangeRequestService,
  ) {}

  /**
   * Get the Application Offering Change Request by its id.
   * @param id the Application Offering Change Request id.
   * @param options method options:
   * - `studentId`: student id for student authorization.
   * - `locationId`: location id for institution authorization.
   * @returns application offering change request.
   */
  async getById(
    id: number,
    options?: {
      studentId?: number;
      locationId?: number;
    },
  ): Promise<ApplicationOfferingChangesAPIOutDTO> {
    const request = await this.applicationOfferingChangeRequestService.getById(
      id,
      { studentId: options?.studentId },
    );
    if (!request) {
      throw new NotFoundException(
        "Not able to find an Application Offering Change Request.",
      );
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
