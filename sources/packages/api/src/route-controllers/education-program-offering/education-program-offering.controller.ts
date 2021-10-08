import {
  Body,
  Controller,
  Post,
  Patch,
  Param,
  Get,
  UnprocessableEntityException,
  ForbiddenException,
  NotFoundException,
  Query,
} from "@nestjs/common";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  HasLocationAccess,
  UserToken,
} from "../../auth/decorators";
import {
  SaveEducationProgramOfferingDto,
  EducationProgramOfferingDto,
  ProgramOfferingDto,
  ProgramOfferingDetailsDto,
} from "./models/education-program-offering.dto";
import { FormNames } from "../../services/form/constants";
import {
  EducationProgramOfferingService,
  FormService,
  ProgramYearService,
  EducationProgramService,
} from "../../services";
import { OptionItem } from "../../types";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import { OfferingTypes, OfferingIntensity } from "../../database/entities";
import { getOfferingNameAndPeriod, dateString } from "../../utilities";

@Controller("institution/offering")
export class EducationProgramOfferingController {
  constructor(
    private readonly programOfferingService: EducationProgramOfferingService,
    private readonly formService: FormService,
    private readonly programService: EducationProgramService,
    private readonly programYearService: ProgramYearService,
  ) {}

  @AllowAuthorizedParty(AuthorizedParties.institution)
  @HasLocationAccess("locationId")
  @Post("location/:locationId/education-program/:programId")
  async create(
    @Body() payload: SaveEducationProgramOfferingDto,
    @Param("locationId") locationId: number,
    @Param("programId") programId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<number> {
    const requestProgram = await this.programService.getInstitutionProgram(
      programId,
      userToken.authorizations.institutionId,
    );
    if (!requestProgram) {
      throw new NotFoundException();
    }
    const submissionResult = await this.formService.dryRunSubmission(
      FormNames.EducationProgramOffering,
      payload,
    );

    if (!submissionResult.valid) {
      throw new UnprocessableEntityException(
        "Not able to a create a program offering due to an invalid request.",
      );
    }

    const createdProgramOffering =
      await this.programOfferingService.createEducationProgramOffering(
        locationId,
        programId,
        payload,
      );
    return createdProgramOffering.id;
  }

  @AllowAuthorizedParty(AuthorizedParties.institution)
  @HasLocationAccess("locationId")
  @Get("location/:locationId/education-program/:programId")
  async getAllEducationProgramOffering(
    @Param("locationId") locationId: number,
    @Param("programId") programId: number,
  ): Promise<EducationProgramOfferingDto[]> {
    //To retrieve Education program offering corresponding to ProgramId and LocationId
    const programOfferingList =
      await this.programOfferingService.getAllEducationProgramOffering(
        locationId,
        programId,
        [OfferingTypes.public],
      );
    if (!programOfferingList) {
      throw new UnprocessableEntityException(
        "Not able to find a Education Program Offering associated with the current Education Program and Location.",
      );
    }
    return programOfferingList.map((offering) => ({
      id: offering.id,
      name: offering.name,
      studyDates: offering.studyDates,
      offeringDelivered: offering.offeringDelivered,
      offeringIntensity: offering.offeringIntensity,
    }));
  }

  @AllowAuthorizedParty(AuthorizedParties.institution)
  @HasLocationAccess("locationId")
  @Get("location/:locationId/education-program/:programId/offering/:offeringId")
  async getProgramOffering(
    @Param("locationId") locationId: number,
    @Param("programId") programId: number,
    @Param("offeringId") offeringId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<ProgramOfferingDto> {
    //To retrieve Education program offering corresponding to ProgramId and LocationId
    const offering = await this.programOfferingService.getProgramOffering(
      locationId,
      programId,
      offeringId,
    );
    if (!offering) {
      throw new UnprocessableEntityException(
        "Not able to find a Education Program Offering associated with the current Education Program, Location and offering.",
      );
    }
    return {
      id: offering.id,
      name: offering.name,
      studyStartDate: offering.studyStartDate,
      studyEndDate: offering.studyEndDate,
      breakStartDate: offering.breakStartDate,
      breakEndDate: offering.breakEndDate,
      actualTuitionCosts: offering.actualTuitionCosts,
      programRelatedCosts: offering.programRelatedCosts,
      mandatoryFees: offering.mandatoryFees,
      exceptionalExpenses: offering.exceptionalExpenses,
      tuitionRemittanceRequestedAmount:
        offering.tuitionRemittanceRequestedAmount,
      offeringDelivered: offering.offeringDelivered,
      lacksStudyDates: offering.lacksStudyDates,
      lacksStudyBreaks: offering.lacksStudyBreaks,
      lacksFixedCosts: offering.lacksFixedCosts,
      tuitionRemittanceRequested: offering.tuitionRemittanceRequested,
      offeringIntensity: offering.offeringIntensity,
    };
  }

  @AllowAuthorizedParty(AuthorizedParties.institution)
  @HasLocationAccess("locationId")
  @Patch(
    "location/:locationId/education-program/:programId/offering/:offeringId",
  )
  async updateProgramOffering(
    @Body() payload: SaveEducationProgramOfferingDto,
    @UserToken() userToken: IInstitutionUserToken,
    @Param("locationId") locationId: number,
    @Param("programId") programId?: number,
    @Param("offeringId") offeringId?: number,
  ): Promise<number> {
    const requestOffering =
      await this.programOfferingService.getProgramOffering(
        locationId,
        programId,
        offeringId,
      );
    if (!requestOffering) {
      throw new ForbiddenException();
    }
    const requestProgram = await this.programService.getInstitutionProgram(
      programId,
      userToken.authorizations.institutionId,
    );
    if (!requestProgram) {
      throw new ForbiddenException();
    }
    const updatingResult = await this.formService.dryRunSubmission(
      FormNames.EducationProgramOffering,
      payload,
    );

    if (!updatingResult.valid) {
      throw new UnprocessableEntityException(
        "Not able to a update a program offering due to an invalid request.",
      );
    }

    const updateProgramOffering =
      await this.programOfferingService.updateEducationProgramOffering(
        locationId,
        programId,
        offeringId,
        payload,
      );
    return updateProgramOffering.affected;
  }

  /**
   * Get a key/value pair list of all offerings that
   * belongs to a program under a location. Executes the
   * students-based authorization (students must have access
   * to all offerings).
   * @param locationId location id.
   * @param programId program id.
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
    @Query("selectedIntensity") selectedIntensity: OfferingIntensity,
  ): Promise<OptionItem[]> {
    const offerings =
      await this.programOfferingService.getProgramOfferingsForLocation(
        locationId,
        programId,
        programYearId,
        selectedIntensity,
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
  ): Promise<OptionItem[]> {
    const offerings =
      await this.programOfferingService.getProgramOfferingsForLocation(
        locationId,
        programId,
        programYearId,
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
}
