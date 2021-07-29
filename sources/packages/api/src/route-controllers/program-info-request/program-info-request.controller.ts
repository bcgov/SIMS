import {
  Controller,
  Patch,
  Param,
  Body,
  UnauthorizedException,
  UnprocessableEntityException,
  InternalServerErrorException,
} from "@nestjs/common";
import { CompleteProgramInfoRequestDto } from "./models/program-info-request.dto";
import { HasLocationAccess, AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  ApplicationService,
  EducationProgramOfferingService,
  WorkflowActionsService,
  PIR_REQUEST_NOT_FOUND_ERROR,
} from "../../services";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("institution/location")
export class ProgramInfoRequestController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly workflowService: WorkflowActionsService,
    private readonly offeringService: EducationProgramOfferingService,
  ) {}

  /**
   * Completes the Program Info Request (PIR), defining the PIR status as
   * completed in the student application table.
   * @param locationId location that is completing the PIR.
   * @param applicationId application id to be updated.
   * @param payload contains the offering id to be updated in the student application.
   */
  @HasLocationAccess("locationId")
  @Patch(":locationId/program-info-request/application/:applicationId/complete")
  async completeProgramInfoRequest(
    @Param("locationId") locationId: number,
    @Param("applicationId") applicationId: number,
    @Body() payload: CompleteProgramInfoRequestDto,
  ): Promise<void> {
    // Check if the offering belongs to the location.
    const offeringLocationId = await this.offeringService.getOfferingLocationId(
      payload.offeringId,
    );
    if (offeringLocationId !== locationId) {
      throw new UnauthorizedException(
        "The location does not have access to the offering.",
      );
    }

    try {
      const updatedApplication =
        await this.applicationService.setOfferingForProgramInfoRequest(
          applicationId,
          locationId,
          payload.offeringId,
        );

      // Send a message to allow the workflow to proceed.
      await this.workflowService.sendProgramInfoCompletedMessage(
        updatedApplication.assessmentWorkflowId,
      );
    } catch (error) {
      if (error.name === PIR_REQUEST_NOT_FOUND_ERROR) {
        throw new UnprocessableEntityException(error.message);
      }

      throw new InternalServerErrorException(
        "Error while completing a Program Information Request (PIR).",
      );
    }
  }
}
