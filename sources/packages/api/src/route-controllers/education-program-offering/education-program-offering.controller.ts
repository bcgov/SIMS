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
  SaveOfferingDTO,
  ProgramOfferingDto,
  ProgramOfferingDetailsDto,
  transformToProgramOfferingDto,
} from "./models/education-program-offering.dto";
import { FormNames } from "../../services/form/constants";
import {
  EducationProgramOfferingService,
  FormService,
  EducationProgramService,
  ApplicationService,
} from "../../services";
import { OptionItem } from "../../types";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import { OfferingTypes, OfferingIntensity } from "../../database/entities";
import {
  getOfferingNameAndPeriod,
  FieldSortOrder,
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_LIMIT,
  PaginatedResults,
} from "../../utilities";
import { UserGroups } from "../../auth/user-groups.enum";
import { EducationProgramOfferingModel } from "../../services/education-program-offering/education-program-offering.service.models";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";

@Controller("institution/offering")
@ApiTags("institution")
export class EducationProgramOfferingController extends BaseController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly programOfferingService: EducationProgramOfferingService,
    private readonly formService: FormService,
    private readonly programService: EducationProgramService,
  ) {
    super();
  }

  @AllowAuthorizedParty(AuthorizedParties.institution)
  @HasLocationAccess("locationId")
  @Post("location/:locationId/education-program/:programId")
  async create(
    @Body() payload: SaveOfferingDTO,
    @Param("locationId") locationId: number,
    @Param("programId") programId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
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
        submissionResult.data.data,
      );
    return { id: createdProgramOffering.id };
  }

  /**
   * Offering Summary for an institution location
   * @param locationId location id
   * @param programId program id
   * @param pageLimit is the number of rows shown in the table
   * @param page is the number of rows that is skipped/offset from the total list.
   * For example page 2 the skip would be 10 when we select 10 rows per page.
   * @param sortField the sorting column.
   * @param sortOrder sorting order.
   * @param searchCriteria search by offering name
   * @returns paginated offering summary
   */
  @AllowAuthorizedParty(AuthorizedParties.institution)
  @HasLocationAccess("locationId")
  @Get("location/:locationId/education-program/:programId")
  async getAllEducationProgramOffering(
    @Param("locationId") locationId: number,
    @Param("programId") programId: number,
    @Query("searchCriteria") searchCriteria: string,
    @Query("sortField") sortField: string,
    @Query("sortOrder") sortOrder = FieldSortOrder.ASC,
    @Query("page") page = DEFAULT_PAGE_NUMBER,
    @Query("pageLimit") pageLimit = DEFAULT_PAGE_LIMIT,
  ): Promise<PaginatedResults<EducationProgramOfferingModel>> {
    //To retrieve Education program offering corresponding to ProgramId and LocationId
    // [OfferingTypes.applicationSpecific] offerings are
    // created during PIR, if required, and they are supposed
    // to be viewed only associated to the application that they
    // were associated to during the PIR, hence they should not
    // be displayed alongside with the public offerings.
    return this.programOfferingService.getAllEducationProgramOffering(
      locationId,
      programId,
      {
        searchCriteria: searchCriteria,
        sortField: sortField,
        sortOrder: sortOrder,
        page: page,
        pageLimit: pageLimit,
      },
      [OfferingTypes.Public, OfferingTypes.Private],
    );
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
    return transformToProgramOfferingDto(offering);
  }

  @AllowAuthorizedParty(AuthorizedParties.institution)
  @HasLocationAccess("locationId")
  @Patch(
    "location/:locationId/education-program/:programId/offering/:offeringId",
  )
  async updateProgramOffering(
    @Body() payload: SaveOfferingDTO,
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
        updatingResult.data.data,
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
      throw new NotFoundException("Invalid offering intensity.");
    }
    const offerings =
      await this.programOfferingService.getProgramOfferingsForLocation(
        locationId,
        programId,
        programYearId,
        offeringIntensity,
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
   * Offering Summary for ministry users
   * @param locationId location id
   * @param programId program id
   * @param pageLimit is the number of rows shown in the table
   * @param page is the number of rows that is skipped/offset from the total list.
   * For example page 2 the skip would be 10 when we select 10 rows per page.
   * @param sortField the sorting column.
   * @param sortOrder sorting order.
   * @param searchCriteria search by offering name
   * @returns paginated offering summary
   */
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Groups(UserGroups.AESTUser)
  @Get("location/:locationId/education-program/:programId/aest")
  async getOfferingSummary(
    @Param("locationId") locationId: number,
    @Param("programId") programId: number,
    @Query("searchCriteria") searchCriteria: string,
    @Query("sortField") sortField: string,
    @Query("sortOrder") sortOrder = FieldSortOrder.ASC,
    @Query("page") page = DEFAULT_PAGE_NUMBER,
    @Query("pageLimit") pageLimit = DEFAULT_PAGE_LIMIT,
  ): Promise<PaginatedResults<EducationProgramOfferingModel>> {
    //To retrieve Education program offering corresponding to ProgramId and LocationId
    // [OfferingTypes.applicationSpecific] offerings are
    // created during PIR, if required, and they are supposed
    // to be viewed only associated to the application that they
    // were associated to during the PIR, hence they should not
    // be displayed alongside with the public offerings.
    return this.programOfferingService.getAllEducationProgramOffering(
      locationId,
      programId,
      {
        searchCriteria: searchCriteria,
        sortField: sortField,
        sortOrder: sortOrder,
        page: page,
        pageLimit: pageLimit,
      },
      [OfferingTypes.Public, OfferingTypes.Private],
    );
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
}
