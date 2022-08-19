import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  Groups,
  HasLocationAccess,
  UserToken,
} from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import {
  OfferingIntensity,
  OfferingStatus,
  OfferingTypes,
} from "../../database/entities";
import {
  EducationProgramOfferingService,
  EducationProgramService,
  FormService,
} from "../../services";
import { FormNames } from "../../services/form/constants";
import { OptionItem } from "../../types";
import { CustomNamedError, getOfferingNameAndPeriod } from "../../utilities";
import BaseController from "../BaseController";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import {
  EducationProgramOfferingAPIInDTO,
  ProgramOfferingDetailsDto,
  ProgramOfferingDto,
  transformToProgramOfferingDto,
} from "./models/education-program-offering.dto";

@Controller("institution/offering")
@ApiTags("institution")
export class EducationProgramOfferingController extends BaseController {
  constructor(
    private readonly programOfferingService: EducationProgramOfferingService,
    private readonly formService: FormService,
    private readonly programService: EducationProgramService,
  ) {
    super();
  }

  @AllowAuthorizedParty(AuthorizedParties.institution)
  @HasLocationAccess("locationId")
  @Get("location/:locationId/education-program/:programId/offering/:offeringId")
  async getProgramOffering(
    @Param("locationId", ParseIntPipe) locationId: number,
    @Param("programId", ParseIntPipe) programId: number,
    @Param("offeringId", ParseIntPipe) offeringId: number,
  ): Promise<ProgramOfferingDto> {
    //To retrieve Education program offering corresponding to ProgramId and LocationId
    const offeringPromise = this.programOfferingService.getProgramOffering(
      locationId,
      programId,
      offeringId,
    );

    const existingApplicationPromise =
      this.programOfferingService.hasExistingApplication(offeringId);

    const [offering, hasExistingApplication] = await Promise.all([
      offeringPromise,
      existingApplicationPromise,
    ]);
    if (!offering) {
      throw new NotFoundException(
        "Not able to find an Education Program Offering associated with the current Education Program, Location and offering.",
      );
    }
    return transformToProgramOfferingDto(offering, hasExistingApplication);
  }

  /**
   * Get a key/value pair list of all offerings that
   * belongs to a program under a location. Executes the
   * students-based authorization (students must have access
   * to all offerings).
   * @param locationId location id.
   * @param programId program id.
   * @query selectedIntensity selectedIntensity,
   * @query includeInActivePY includeInActivePY, if includeInActivePY, then both active
   * and not active program year is considered
   * @returns key/value pair list of programs for students.
   */
  @AllowAuthorizedParty(AuthorizedParties.student)
  @Get(
    "location/:locationId/education-program/:programId/program-year/:programYearId/options-list",
  )
  async getProgramOfferingsByLocation(
    @Param("locationId") locationId: number,
    @Param("programId") programId: number,
    @Param("programYearId") programYearId: number,
    @Query("offeringIntensity") offeringIntensity?: OfferingIntensity,
    @Query("includeInActivePY") includeInActivePY = false,
  ): Promise<OptionItem[]> {
    if (
      offeringIntensity &&
      !Object.values(OfferingIntensity).includes(offeringIntensity)
    ) {
      throw new UnprocessableEntityException("Invalid offering intensity.");
    }
    const offeringsFilter = {
      offeringIntensity: offeringIntensity,
      offeringStatus: OfferingStatus.Approved,
      offeringTypes: [OfferingTypes.Public],
    };
    const offerings =
      await this.programOfferingService.getProgramOfferingsForLocation(
        locationId,
        programId,
        programYearId,
        offeringsFilter,
        includeInActivePY,
      );
    return offerings.map((offering) => ({
      id: offering.id,
      description: getOfferingNameAndPeriod(offering),
    }));
  }

  /**
   * Get a key/value pair list of all offerings that
   * belongs to a program under a location. Executes the
   * location-based authorization (locations must have
   * access to their specific offerings only).
   * @param locationId location id.
   * @param programId program id.
   * @param programYearId program year id.
   * @query offeringIntensity offering intensity selected by student.
   * @query includeInActivePY, if includeInActivePY is true,
   * then consider both active and inactive program year.
   * @returns key/value pair list of programs for students.
   */
  @AllowAuthorizedParty(AuthorizedParties.institution)
  @HasLocationAccess("locationId")
  @Get(
    "location/:locationId/education-program/:programId/program-year/:programYearId/offerings-list",
  )
  async getProgramOfferingsForLocationForInstitution(
    @Param("locationId") locationId: number,
    @Param("programId") programId: number,
    @Param("programYearId") programYearId: number,
    @Query("offeringIntensity")
    offeringIntensity?: OfferingIntensity,
    @Query("includeInActivePY") includeInActivePY = false,
  ): Promise<OptionItem[]> {
    if (
      offeringIntensity &&
      !Object.values(OfferingIntensity).includes(offeringIntensity)
    ) {
      throw new UnprocessableEntityException("Invalid offering intensity.");
    }
    const offeringsFilter = {
      offeringIntensity: offeringIntensity,
      offeringStatus: OfferingStatus.Approved,
      offeringTypes: [OfferingTypes.Public, OfferingTypes.Private],
    };
    const offerings =
      await this.programOfferingService.getProgramOfferingsForLocation(
        locationId,
        programId,
        programYearId,
        offeringsFilter,
        includeInActivePY,
      );
    return offerings.map((offering) => ({
      id: offering.id,
      description: getOfferingNameAndPeriod(offering),
    }));
  }

  /**
   * Gets program offering details
   * @param offeringId offering id
   * @returns offering details for the given offering
   */
  @AllowAuthorizedParty(AuthorizedParties.student)
  @Get(":offeringId")
  async getProgramOfferingDetails(
    @Param("offeringId") offeringId: number,
  ): Promise<ProgramOfferingDetailsDto> {
    //To retrieve Education program offering corresponding to ProgramId and LocationId
    const offering = await this.programOfferingService.getOfferingById(
      offeringId,
    );
    if (!offering) {
      throw new UnprocessableEntityException(
        "Education Program Offering not found.",
      );
    }
    return {
      studyStartDate: offering.studyStartDate,
    };
  }

  /**
   * Offering details for ministry users
   * @param offeringId offering id
   * @returns Offering details
   */
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Groups(UserGroups.AESTUser)
  @Get(":offeringId/aest")
  async getProgramOfferingForAEST(
    @Param("offeringId") offeringId: number,
  ): Promise<ProgramOfferingDto> {
    //To retrieve Education program offering corresponding to ProgramId and LocationId
    const offering = await this.programOfferingService.getOfferingById(
      offeringId,
    );
    if (!offering) {
      throw new NotFoundException(
        "offering not found because the id does not exist.",
      );
    }
    return transformToProgramOfferingDto(offering);
  }

  /**
   * Request a change to offering to modify it's
   * properties that affect the assessment of student application.
   ** During this process a new offering is created by copying the existing
   * offering and modifying the properties required.
   * @param offeringId offering to which change is requested.
   * @param payload offering data to create
   * the new offering.
   * @param locationId location to which the offering
   * belongs to.
   * @param programId program to which the offering belongs to.
   * @returns primary identifier of created resource.
   */
  @AllowAuthorizedParty(AuthorizedParties.institution)
  @HasLocationAccess("locationId")
  @Post(
    ":offeringId/location/:locationId/education-program/:programId/request-change",
  )
  @ApiNotFoundResponse({
    description: "Program for the given institution not found.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "The request is not valid or offering for given program and location not found or not in valid status.",
  })
  async requestChange(
    @Body() payload: EducationProgramOfferingAPIInDTO,
    @Param("offeringId", ParseIntPipe) offeringId: number,
    @Param("locationId", ParseIntPipe) locationId: number,
    @Param("programId", ParseIntPipe) programId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    const program = await this.programService.getInstitutionProgram(
      programId,
      userToken.authorizations.institutionId,
    );
    if (!program) {
      throw new NotFoundException("Program not found for the institution.");
    }
    const submissionResult = await this.formService.dryRunSubmission(
      FormNames.EducationProgramOffering,
      payload,
    );

    if (!submissionResult.valid) {
      throw new UnprocessableEntityException(
        "Not able to request a change for program offering due to an invalid request.",
      );
    }

    try {
      const requestedOffering = await this.programOfferingService.requestChange(
        locationId,
        programId,
        offeringId,
        userToken.userId,
        submissionResult.data.data,
      );
      return { id: requestedOffering.id };
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        throw new UnprocessableEntityException(error.message);
      }
      throw error;
    }
  }
}
