import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { EducationProgramOfferingControllerService } from "./education-program-offering.controller.service";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  HasLocationAccess,
  UserToken,
} from "../../auth/decorators";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import {
  EducationProgramOfferingService,
  EducationProgramService,
  FormService,
} from "../../services";
import { FormNames } from "../../services/form/constants";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import {
  OfferingsPaginationOptionsAPIInDTO,
  PaginatedResultsAPIOutDTO,
} from "../models/pagination.dto";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import {
  EducationProgramOfferingAPIInDTO,
  EducationProgramOfferingSummaryAPIOutDTO,
} from "./models/education-program-offering.dto";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("education-program-offering")
@ApiTags(`${ClientTypeBaseRoute.Institution}-education-program-offering`)
export class EducationProgramOfferingInstitutionsController extends BaseController {
  constructor(
    private readonly programOfferingService: EducationProgramOfferingService,
    private readonly formService: FormService,
    private readonly programService: EducationProgramService,
    private readonly educationProgramOfferingControllerService: EducationProgramOfferingControllerService,
  ) {
    super();
  }

  /**
   * Create new offering.
   * @param payload offering data.
   * @param locationId offering location.
   * @param programId offering program.
   * @param userToken
   * @returns primary identifier of the created offering.
   */
  @HasLocationAccess("locationId")
  @ApiNotFoundResponse({
    description: "Program to create the offering not found.",
  })
  @ApiUnprocessableEntityResponse({
    description: "Not able to a create an offering due to an invalid request.",
  })
  @Post("location/:locationId/education-program/:programId")
  async createOffering(
    @Body() payload: EducationProgramOfferingAPIInDTO,
    @Param("locationId") locationId: number,
    @Param("programId") programId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    // Location id in the param is validated by the decorator.
    // Only program id is validated here.
    const requestProgram = await this.programService.getInstitutionProgram(
      programId,
      userToken.authorizations.institutionId,
    );

    if (!requestProgram) {
      throw new NotFoundException("Program to create the offering not found.");
    }

    const submissionResult = await this.formService.dryRunSubmission(
      FormNames.EducationProgramOffering,
      payload,
    );

    if (!submissionResult.valid) {
      throw new UnprocessableEntityException(
        "Not able to a create an offering due to an invalid request.",
      );
    }

    const createdProgramOffering =
      await this.programOfferingService.createEducationProgramOffering(
        locationId,
        programId,
        submissionResult.data.data,
        userToken.userId,
      );
    return { id: createdProgramOffering.id };
  }

  /**
   * Update offering.
   ** An offering which has at least one student aid application submitted
   ** cannot be modified further except the offering name. In such cases
   ** the offering must be requested for change.
   * @param payload offering data to be updated.
   * @param locationId offering location.
   * @param programId offering program.
   * @param offeringId offering to be modified.
   */
  @HasLocationAccess("locationId")
  @Patch(
    "location/:locationId/education-program/:programId/offering/:offeringId",
  )
  async updateProgramOffering(
    @Body() payload: EducationProgramOfferingAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
    @Param("locationId") locationId: number,
    @Param("programId") programId: number,
    @Param("offeringId") offeringId: number,
  ): Promise<void> {
    const offering = await this.programOfferingService.getProgramOffering(
      locationId,
      programId,
      offeringId,
      true,
    );
    if (!offering) {
      throw new UnprocessableEntityException(
        "Either offering for the program and location not found or the offering not in appropriate status to be updated.",
      );
    }
    const submissionResult = await this.formService.dryRunSubmission(
      FormNames.EducationProgramOffering,
      payload,
    );

    if (!submissionResult.valid) {
      throw new UnprocessableEntityException(
        "Not able to a update a program offering due to an invalid request.",
      );
    }
    await this.programOfferingService.updateEducationProgramOffering(
      locationId,
      programId,
      offeringId,
      submissionResult.data.data,
      userToken.userId,
    );
  }

  /**
   * Get summary of offerings for a program and location.
   * Pagination, sort and search are available on results.
   * @param locationId offering location.
   * @param programId offering program.
   * @param paginationOptions pagination options.
   * @returns offering summary results.
   */
  @HasLocationAccess("locationId")
  @Get("location/:locationId/education-program/:programId")
  async getOfferingsSummary(
    @Param("locationId") locationId: number,
    @Param("programId") programId: number,
    @Query() paginationOptions: OfferingsPaginationOptionsAPIInDTO,
  ): Promise<
    PaginatedResultsAPIOutDTO<EducationProgramOfferingSummaryAPIOutDTO>
  > {
    return this.educationProgramOfferingControllerService.getOfferingsSummary(
      locationId,
      programId,
      paginationOptions,
    );
  }
}
