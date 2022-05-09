import {
  Body,
  Controller,
  NotFoundException,
  Param,
  Patch,
  UnprocessableEntityException,
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
import { OfferingAssessmentAPIInDTO } from "./models/education-program-offering.dto";

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
}
