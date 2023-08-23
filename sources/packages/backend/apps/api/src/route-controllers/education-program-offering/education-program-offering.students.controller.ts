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
import {
  OfferingIntensity,
  OfferingTypes,
  OfferingSummaryPurpose,
  ApplicationOfferingChangeRequest,
} from "@sims/sims-db";
import { EducationProgramOfferingService } from "../../services";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import {
  EducationProgramOfferingSummaryViewAPIOutDTO,
  OfferingDetailsAPIOutDTO,
} from "./models/education-program-offering.dto";
import { OptionItemAPIOutDTO } from "../models/common.dto";
import { EducationProgramOfferingControllerService } from "./education-program-offering.controller.service";
import { ParseEnumQueryPipe } from "../utils/custom-validation-pipe";
import { StudentUserToken } from "../../auth";
import { DataSource, Repository } from "typeorm";

@AllowAuthorizedParty(AuthorizedParties.student)
@Controller("education-program-offering")
@ApiTags(`${ClientTypeBaseRoute.Student}-education-program-offering`)
export class EducationProgramOfferingStudentsController extends BaseController {
  applicationOfferingChangeRepo: Repository<ApplicationOfferingChangeRequest>;
  constructor(
    private readonly dataSource: DataSource,
    private readonly educationProgramOfferingService: EducationProgramOfferingService,
    private readonly educationProgramOfferingControllerService: EducationProgramOfferingControllerService,
  ) {
    super();
    this.applicationOfferingChangeRepo = this.dataSource.getRepository(
      ApplicationOfferingChangeRequest,
    );
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
  @ApiNotFoundResponse({
    description: "Not able to find the Education Program offering.",
  })
  @Get("offering/:offeringId/summary-details")
  async getOfferingSummaryDetailsById(
    @Param("offeringId", ParseIntPipe) offeringId: number,
    @Query("purpose", new ParseEnumQueryPipe(OfferingSummaryPurpose))
    purpose: OfferingSummaryPurpose,
    @UserToken() studentUserToken: StudentUserToken,
  ): Promise<EducationProgramOfferingSummaryViewAPIOutDTO> {
    const validatedApplicationOfferingForStudent =
      await this.validateApplicationOfferingForStudent(
        purpose,
        offeringId,
        studentUserToken.studentId,
      );
    if (!validatedApplicationOfferingForStudent) {
      throw new UnauthorizedException(
        "Student is not authorized for the provided offering.",
      );
    }
    return this.educationProgramOfferingControllerService.getOfferingById(
      offeringId,
    );
  }

  /** Validates student authorization for the given education program offering.
   * @param purpose indicating the purpose to allow for the appropriate authorization flow to be used.
   * @param offeringId offering id.
   * @param studentId student id.
   * @returns true if the student is authorized for the given offering, otherwise false.
   */
  private async validateApplicationOfferingForStudent(
    purpose: OfferingSummaryPurpose,
    offeringId: number,
    studentId: number,
  ): Promise<boolean> {
    if (purpose === OfferingSummaryPurpose.ApplicationOfferingChange) {
      const applicationOfferingChangeId =
        await this.applicationOfferingChangeRepo.findOne({
          select: { id: true },
          where: [
            {
              application: { student: { id: studentId } },
              activeOffering: { id: offeringId },
            },
            {
              application: { student: { id: studentId } },
              requestedOffering: { id: offeringId },
            },
          ],
        });
      return !!applicationOfferingChangeId;
    }
    return false;
  }
}
