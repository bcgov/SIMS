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
  Groups,
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
  EducationProgramService,
} from "../../services";
import { OptionItem } from "../../types";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import { OfferingTypes, OfferingIntensity } from "../../database/entities";
import {
  getOfferingNameAndPeriod,
  getDateOnlyFormat,
  formatDate,
  EXTENDED_DATE_FORMAT,
} from "../../utilities";
import { UserGroups } from "../../auth/user-groups.enum";
import { ProgramsOfferingSummaryPaginated } from "../../services/education-program-offering/education-program-offering.service.models";
import { SortDBOrder } from "../../types/sortDBOrder";

@Controller("institution/offering")
export class EducationProgramOfferingController {
  constructor(
    private readonly programOfferingService: EducationProgramOfferingService,
    private readonly formService: FormService,
    private readonly programService: EducationProgramService,
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
    // [OfferingTypes.applicationSpecific] offerings are created during PIR, if required
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
      offeringName: offering.name,
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
      offeringName: offering.name,
      studyStartDate: offering.studyStartDate,
      studyEndDate: offering.studyEndDate,
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
      yearOfStudy: offering.yearOfStudy,
      showYearOfStudy: offering.showYearOfStudy,
      hasOfferingWILComponent: offering.hasOfferingWILComponent,
      offeringWILType: offering.offeringWILType,
      studyBreaks: offering.studyBreaks,
      offeringDeclaration: offering.offeringDeclaration,
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
    @Query("selectedIntensity") selectedIntensity: OfferingIntensity,
    @Query("includeInActivePY") includeInActivePY = false,
  ): Promise<OptionItem[]> {
    const offerings =
      await this.programOfferingService.getProgramOfferingsForLocation(
        locationId,
        programId,
        programYearId,
        selectedIntensity,
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
    @Query("includeInActivePY") includeInActivePY = false,
  ): Promise<OptionItem[]> {
    const offerings =
      await this.programOfferingService.getProgramOfferingsForLocation(
        locationId,
        programId,
        programYearId,
        undefined,
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
   * Get programs for a particular institution with pagination.
   * @param institutionId id of the institution.
   * @param pageSize is the number of rows shown in the table
   * @param page is the number of rows that is skipped/offset from the total list.
   * For example page 2 the skip would be 10 when we select 10 rows per page.
   * @param sortColumn the sorting column.
   * @param sortOrder sorting order default is descending.
   * @param searchProgramName Search the program name in the query
   * @returns ProgramsOfferingSummaryPaginated.
   */
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Groups(UserGroups.AESTUser)
  @Get("institution/:institutionId/programs")
  async getPaginatedProgramsForInstitution(
    @Param("institutionId") institutionId: number,
    @Query("pageSize") pageSize: number,
    @Query("page") page: number,
    @Query("sortColumn") sortColumn: string,
    @Query("sortOrder") sortOrder: SortDBOrder,
    @Query("searchProgramName") searchProgramName: string,
  ): Promise<ProgramsOfferingSummaryPaginated> {
    const paginatedProgramOfferingSummaryResult =
      await this.programOfferingService.getPaginatedProgramsForInstitution(
        institutionId,
        [OfferingTypes.public],
        pageSize,
        page,
        sortColumn,
        sortOrder,
        searchProgramName,
      );
    const paginatedProgramOfferingSummary =
      paginatedProgramOfferingSummaryResult.programsSummary.map(
        (programOfferingSummary) => ({
          programId: programOfferingSummary.programId,
          programName: programOfferingSummary.programName,
          submittedDate: programOfferingSummary.submittedDate,
          formattedSubmittedDate: getDateOnlyFormat(
            programOfferingSummary.submittedDate,
          ),
          locationName: programOfferingSummary.locationName,
          programStatus: programOfferingSummary.programStatus,
          offeringsCount: programOfferingSummary.offeringsCount,
        }),
      );
    return {
      programsSummary: paginatedProgramOfferingSummary,
      programsCount: paginatedProgramOfferingSummaryResult.programsCount,
    };
  }

  /**
   * Offering Summary for ministry users
   * @param programId program id
   * @returns Offering Summary
   */
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Groups(UserGroups.AESTUser)
  @Get("education-program/:programId/aest")
  async getOfferingSummary(
    @Param("programId") programId: number,
  ): Promise<EducationProgramOfferingDto[]> {
    //To retrieve Education program offering corresponding to ProgramId and LocationId
    // [OfferingTypes.applicationSpecific] offerings are created during PIR, if required
    const programOfferingList =
      await this.programOfferingService.getOfferingSummary(programId, [
        OfferingTypes.public,
      ]);
    if (!programOfferingList) {
      throw new UnprocessableEntityException(
        "Not able to find a Education Program Offering associated with the current Education Program and Location.",
      );
    }
    return programOfferingList.map((offering) => ({
      id: offering.id,
      offeringName: offering.name,
      studyDates:
        offering.studyStartDate && offering.studyEndDate
          ? `${formatDate(
              offering.studyStartDate,
              EXTENDED_DATE_FORMAT,
            )} - ${formatDate(offering.studyEndDate, EXTENDED_DATE_FORMAT)}`
          : "-",
      offeringDelivered: offering.offeringDelivered,
      offeringIntensity: offering.offeringIntensity,
    }));
  }
}
