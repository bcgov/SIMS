import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Query,
  UnauthorizedException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, UserToken } from "../../auth/decorators";
import { OfferingIntensity, OfferingTypes } from "@sims/sims-db";
import { EducationProgramOfferingService } from "../../services";
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import {
  EducationProgramOfferingSummaryViewAPIOutDTO,
  OfferingDetailsAPIOutDTO,
} from "./models/education-program-offering.dto";
import { OptionItemAPIOutDTO } from "../models/common.dto";
import { EducationProgramOfferingControllerService } from "./education-program-offering.controller.service";
import { ParseEnumQueryPipe } from "../utils/custom-validation-pipe";
import { ApplicationOfferingPurpose } from "@sims/sims-db";
import { StudentUserToken } from "../../auth";
import { STUDENT_UNAUTHORIZED_FOR_OFFERING } from "../../constants";

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
    @Param("locationId", ParseIntPipe) locationId: number,
    @Param("programId", ParseIntPipe) programId: number,
    @Param("programYearId", ParseIntPipe) programYearId: number,
    @Query("includeInActivePY", new DefaultValuePipe(false), ParseBoolPipe)
    includeInActivePY: boolean,
    @Query("offeringIntensity", new ParseEnumQueryPipe(OfferingIntensity))
    offeringIntensity?: OfferingIntensity,
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
    @Param("offeringId", ParseIntPipe) offeringId: number,
  ): Promise<OfferingDetailsAPIOutDTO> {
    //To retrieve Education program offering corresponding to ProgramId and LocationId
    const offering = await this.educationProgramOfferingService.getOfferingById(
      offeringId,
    );
    if (!offering) {
      throw new UnprocessableEntityException("Offering not found.");
    }
    return {
      studyStartDate: offering.studyStartDate,
      studyEndDate: offering.studyEndDate,
    };
  }

  /**
   * Gets the offering simplified details, not including, for instance,
   * validations, approvals and extensive data.
   * Useful to have an overview of the offering details, for instance,
   * when the user needs need to have quick access to data in order to
   * support operations like confirmation of enrolment or scholastic
   * standing requests or offering change request.
   * @param offeringId offering.
   * @param purpose indicating the purpose to allow for the appropriate authorization flow to be used.
   * @param studentUserToken student user token for authorization.
   * @returns offering details.
   */
  @ApiUnauthorizedResponse({
    description: "The student is not authorized for the provided offering.",
  })
  @Get("offering/:offeringId/summary-details")
  async getOfferingSummaryDetailsById(
    @Param("offeringId", ParseIntPipe) offeringId: number,
    @Query("purpose", new ParseEnumQueryPipe(ApplicationOfferingPurpose))
    purpose: ApplicationOfferingPurpose,
    @UserToken() studentUserToken: StudentUserToken,
  ): Promise<EducationProgramOfferingSummaryViewAPIOutDTO> {
    if (
      purpose === ApplicationOfferingPurpose.OfferingChange &&
      this.educationProgramOfferingControllerService.validateApplicationOfferingForStudent(
        offeringId,
        studentUserToken.studentId,
      )
    )
      return this.educationProgramOfferingControllerService.getOfferingById(
        offeringId,
      );
    throw new UnauthorizedException(
      new ApiProcessError(
        "Student is not authorized for the provided offering.",
        STUDENT_UNAUTHORIZED_FOR_OFFERING,
      ),
    );
  }
}
