import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  UnprocessableEntityException,
  ParseIntPipe,
} from "@nestjs/common";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { OfferingStatus } from "../../database/entities";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups, UserToken } from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import { IUserToken } from "../../auth/userToken.interface";
import { EducationProgramOfferingService } from "../../services";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import {
  OfferingAssessmentAPIInDTO,
  OfferingChangeRequestAPIOutDTO,
  PrecedingOfferingSummaryAPIOutDTO,
  transformToProgramOfferingDto,
  ProgramOfferingDto,
  OfferingChangeAssessmentAPIInDTO,
} from "./models/education-program-offering.dto";
import { CustomNamedError } from "../../utilities";

/**
 * Institution location controller for institutions Client.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("institution/offering")
@ApiTags(`${ClientTypeBaseRoute.AEST}-institution/offering`)
export class EducationProgramOfferingAESTController extends BaseController {
  constructor(
    private readonly programOfferingService: EducationProgramOfferingService,
  ) {
    super();
  }

  /**
   * API to assess and update the status of a pending offering.
   * @param offeringId
   * @param payload
   * @param userToken
   */
  @ApiNotFoundResponse({ description: "Offering not found." })
  @ApiUnprocessableEntityResponse({
    description:
      "Offering status is incorrect. Only pending offerings can be approved/declined.",
  })
  @Patch(":offeringId/assess")
  async assessOffering(
    @Param("offeringId") offeringId: number,
    @Body() payload: OfferingAssessmentAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    const offering = await this.programOfferingService.getOfferingById(
      offeringId,
    );
    if (!offering) {
      throw new NotFoundException("Offering not found.");
    }
    if (offering.offeringStatus !== OfferingStatus.Pending) {
      throw new UnprocessableEntityException(
        "Offering status is incorrect. Only pending offerings can be approved/declined.",
      );
    }
    await this.programOfferingService.assessOffering(
      offeringId,
      offering.institutionLocation.institution.id,
      userToken.userId,
      payload.assessmentNotes,
      payload.offeringStatus,
    );
  }
  /**
   * Get all offerings that were requested for change and waiting to be approved/declined.
   * @returns offerings which were requested for change.
   */
  @Get("change-requests")
  async getOfferingChangeRequests(): Promise<OfferingChangeRequestAPIOutDTO[]> {
    const offerings =
      await this.programOfferingService.getOfferingChangeRequests();

    return offerings.map((offering) => ({
      offeringId: offering.id,
      programId: offering.educationProgram.id,
      offeringName: offering.name,
      submittedDate: offering.submittedDate,
      locationName: offering.institutionLocation.name,
      institutionName:
        offering.institutionLocation.institution.legalOperatingName,
    }));
  }

  /**
   * For a given offering which is requested as change
   * get the summary of it's actual(preceding) offering.
   * @param offeringId actual offering id.
   * @returns preceding offering summary.
   */
  @Get(":offeringId/preceding-offering-summary")
  async getPrecedingOfferingSummary(
    @Param("offeringId", ParseIntPipe) offeringId: number,
  ): Promise<PrecedingOfferingSummaryAPIOutDTO> {
    return this.programOfferingService.getPrecedingOfferingSummary(offeringId);
  }

  /**
   * Get preceding offering details.
   * @param offeringId actual offering id.
   * @returns Preceding offering details.
   */
  @ApiNotFoundResponse({
    description: "Offering not found.",
  })
  @Get(":offeringId/preceding-offering")
  async getPrecedingOfferingByActualOfferingId(
    @Param("offeringId", ParseIntPipe) offeringId: number,
  ): Promise<ProgramOfferingDto> {
    const offering = await this.programOfferingService.getOfferingById(
      offeringId,
      true,
    );
    if (!offering) {
      throw new NotFoundException("Offering not found.");
    }
    return transformToProgramOfferingDto(offering);
  }

  /**
   * Approve or Decline an offering change
   * requested by institution.
   * @param offeringId offering that is requested for change.
   * @param payload offering change payload.
   * @param userToken User who approves or declines the offering.
   */
  @Patch(":offeringId/assess-change-request")
  @ApiUnprocessableEntityResponse({
    description:
      "Either offering or preceding offering not found or the offering not in appropriate status to be approved or declined for change.",
  })
  async assessOfferingChangeRequest(
    @Param("offeringId", ParseIntPipe) offeringId: number,
    @Body() payload: OfferingChangeAssessmentAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    try {
      await this.programOfferingService.assessOfferingChangeRequest(
        offeringId,
        userToken.userId,
        payload.assessmentNotes,
        payload.offeringStatus,
      );
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        throw new UnprocessableEntityException(error.message);
      }
      throw error;
    }
  }
}
