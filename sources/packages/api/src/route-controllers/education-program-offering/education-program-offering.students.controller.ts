import {
  Controller,
  Get,
  Param,
  Query,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { OfferingIntensity, OfferingTypes } from "../../database/entities";
import { EducationProgramOfferingService } from "../../services";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import { OfferingStartDateAPIOutDTO } from "./models/education-program-offering.dto";
import { OptionItemAPIOutDTO } from "../models/common.dto";
import { EducationProgramOfferingControllerService } from "./education-program-offering.controller.service";

@AllowAuthorizedParty(AuthorizedParties.student)
@Controller("education-program-offering")
@ApiTags(`${ClientTypeBaseRoute.Student}-education-program-offering`)
export class EducationProgramOfferingStudentsController extends BaseController {
  constructor(
    private readonly educationProgramOfferingService: EducationProgramOfferingService,
    private readonly educationProgramOfferingControllerService: EducationProgramOfferingControllerService,
  ) {
    super();
  }

  /**
   * Get offerings for the given program and location
   * in client lookup format.
   * @param locationId offering location.
   * @param programId offering program.
   * @param programYearId program year of the offering program.
   * @param offeringIntensity offering intensity.
   * @param includeInActivePY if includeInActivePY is true/supplied then both active
   * and not active program year are considered.
   * @returns offerings in client lookup format.
   */
  @ApiUnprocessableEntityResponse({
    description: "Invalid offering intensity.",
  })
  @Get(
    "location/:locationId/education-program/:programId/program-year/:programYearId",
  )
  async getProgramOfferingsOptionsList(
    @Param("locationId") locationId: number,
    @Param("programId") programId: number,
    @Param("programYearId") programYearId: number,
    @Query("includeInActivePY") includeInActivePY = false,
    @Query("offeringIntensity") offeringIntensity?: OfferingIntensity,
  ): Promise<OptionItemAPIOutDTO[]> {
    return this.educationProgramOfferingControllerService.getProgramOfferingsOptionsList(
      locationId,
      programId,
      programYearId,
      [OfferingTypes.Public],
      includeInActivePY,
      offeringIntensity,
    );
  }

  /**
   * Get offering start date of a given offering.
   * @param offeringId offering id
   * @returns offering with start date value.
   */
  @ApiNotFoundResponse({ description: "Offering not found." })
  @Get(":offeringId")
  async getProgramOfferingDetails(
    @Param("offeringId") offeringId: number,
  ): Promise<OfferingStartDateAPIOutDTO> {
    //To retrieve Education program offering corresponding to ProgramId and LocationId
    const offering = await this.educationProgramOfferingService.getOfferingById(
      offeringId,
    );
    if (!offering) {
      throw new UnprocessableEntityException("Offering not found.");
    }
    return {
      studyStartDate: offering.studyStartDate,
    };
  }
}
