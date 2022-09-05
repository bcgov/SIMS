import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UnprocessableEntityException,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  HasLocationAccess,
  IsInstitutionAdmin,
  UserToken,
} from "../../auth/decorators";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import { OfferingIntensity, OfferingTypes } from "../../database/entities";
import {
  EducationProgramOfferingService,
  EducationProgramService,
  FormService,
} from "../../services";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import { OptionItemAPIOutDTO } from "../models/common.dto";
import {
  OfferingsPaginationOptionsAPIInDTO,
  PaginatedResultsAPIOutDTO,
} from "../models/pagination.dto";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { EducationProgramOfferingControllerService } from "./education-program-offering.controller.service";
import {
  EducationProgramOfferingAPIInDTO,
  EducationProgramOfferingAPIOutDTO,
  EducationProgramOfferingSummaryAPIOutDTO,
  transformToProgramOfferingDTO,
} from "./models/education-program-offering.dto";
import {
  csvFileFilter,
  CustomNamedError,
  MAX_UPLOAD_FILES,
  OFFERING_BULK_FILE_ENCODING,
  OFFERING_BULK_UPLOAD_MAX_FILE_SIZE,
  OFFERING_BULK_UPLOAD_MAX_UPLOAD_PARTS,
  uploadLimits,
} from "../../utilities";
import { FileInterceptor } from "@nestjs/platform-express";
import { EducationProgramOfferingBulkInsertService } from "../../services/education-program-offering/education-program-offering-bulk-insert.service";
import { EducationProgramOfferingValidationService } from "../../services/education-program-offering/education-program-offering-validation.service";
import { OFFERING_VALIDATION_CRITICAL_ERROR } from "../../constants";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("education-program-offering")
@ApiTags(`${ClientTypeBaseRoute.Institution}-education-program-offering`)
export class EducationProgramOfferingInstitutionsController extends BaseController {
  constructor(
    private readonly programOfferingService: EducationProgramOfferingService,
    private readonly formService: FormService,
    private readonly programService: EducationProgramService,
    private readonly educationProgramOfferingControllerService: EducationProgramOfferingControllerService,
    private readonly educationProgramOfferingBulkInsertService: EducationProgramOfferingBulkInsertService,
    private readonly educationProgramOfferingValidationService: EducationProgramOfferingValidationService,
  ) {
    super();
  }

  /**
   * Create new offering.
   * @param payload offering data.
   * @param locationId offering location.
   * @param programId offering program.
   * @returns primary identifier of the created offering.
   */
  @HasLocationAccess("locationId")
  @ApiNotFoundResponse({
    description:
      "Program to create the offering not found for the institution.",
  })
  @ApiUnprocessableEntityResponse({
    description: "Not able to a create an offering due to an invalid request.",
  })
  @Post("location/:locationId/education-program/:programId")
  async createOffering(
    @Body() payload: EducationProgramOfferingAPIInDTO,
    @Param("locationId", ParseIntPipe) locationId: number,
    @Param("programId", ParseIntPipe) programId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    try {
      const saveOfferingModel =
        await this.educationProgramOfferingControllerService.getSaveOfferingModelFromOfferingAPIInDTO(
          userToken.authorizations.institutionId,
          locationId,
          programId,
          payload,
        );
      const createdProgramOffering =
        await this.programOfferingService.createEducationProgramOffering(
          saveOfferingModel,
          userToken.userId,
        );
      const [identifier] = createdProgramOffering.identifiers;
      return { id: +identifier.id };
    } catch (error: unknown) {
      if (
        error instanceof CustomNamedError &&
        error.name === OFFERING_VALIDATION_CRITICAL_ERROR
      ) {
        throw new BadRequestException(error.objectInfo, error.message);
      }
      throw error;
    }
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
  @ApiUnprocessableEntityResponse({
    description:
      "Either offering for the program and location is not found " +
      "or the offering is not in the appropriate status to be updated " +
      "or the request is invalid.",
  })
  @Patch(
    "location/:locationId/education-program/:programId/offering/:offeringId",
  )
  async updateProgramOffering(
    @Body() payload: EducationProgramOfferingAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
    @Param("locationId", ParseIntPipe) locationId: number,
    @Param("programId", ParseIntPipe) programId: number,
    @Param("offeringId", ParseIntPipe) offeringId: number,
  ): Promise<void> {
    const offering = await this.programOfferingService.getProgramOffering(
      locationId,
      programId,
      offeringId,
      true,
    );
    if (!offering) {
      throw new UnprocessableEntityException(
        "Either offering for the program and location is not found or the offering is not in the appropriate status to be updated.",
      );
    }

    try {
      const saveOfferingModel =
        await this.educationProgramOfferingControllerService.getSaveOfferingModelFromOfferingAPIInDTO(
          userToken.authorizations.institutionId,
          locationId,
          programId,
          payload,
        );
      await this.programOfferingService.updateEducationProgramOffering(
        offeringId,
        saveOfferingModel,
        userToken.userId,
      );
    } catch (error: unknown) {
      if (
        error instanceof CustomNamedError &&
        error.name === OFFERING_VALIDATION_CRITICAL_ERROR
      ) {
        throw new BadRequestException(error.objectInfo, error.message);
      }
      throw error;
    }
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
    @Param("locationId", ParseIntPipe) locationId: number,
    @Param("programId", ParseIntPipe) programId: number,
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

  /**
   * Get offering details.
   * @param locationId offering location.
   * @param programId offering program.
   * @param offeringId offering.
   * @returns offering details.
   */
  @HasLocationAccess("locationId")
  @ApiNotFoundResponse({
    description:
      "Not able to find an Education Program Offering" +
      "associated with the current Education Program, Location and offering.",
  })
  @Get("location/:locationId/education-program/:programId/offering/:offeringId")
  async getOfferingDetails(
    @Param("locationId", ParseIntPipe) locationId: number,
    @Param("programId", ParseIntPipe) programId: number,
    @Param("offeringId", ParseIntPipe) offeringId: number,
  ): Promise<EducationProgramOfferingAPIOutDTO> {
    const offeringPromise = this.programOfferingService.getProgramOffering(
      locationId,
      programId,
      offeringId,
    );
    // To check if the offering has any submitted student aid application.
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
    return transformToProgramOfferingDTO(offering, hasExistingApplication);
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
  @Get(
    "location/:locationId/education-program/:programId/program-year/:programYearId",
  )
  @ApiUnprocessableEntityResponse({
    description: "Invalid offering intensity.",
  })
  async getProgramOfferingsOptionsList(
    @Param("locationId", ParseIntPipe) locationId: number,
    @Param("programId", ParseIntPipe) programId: number,
    @Param("programYearId", ParseIntPipe) programYearId: number,
    @Query("includeInActivePY") includeInActivePY = false,
    @Query("offeringIntensity") offeringIntensity?: OfferingIntensity,
  ): Promise<OptionItemAPIOutDTO[]> {
    return this.educationProgramOfferingControllerService.getProgramOfferingsOptionsList(
      locationId,
      programId,
      programYearId,
      [OfferingTypes.Public, OfferingTypes.Private],
      includeInActivePY,
      offeringIntensity,
    );
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
  @HasLocationAccess("locationId")
  @Post(
    ":offeringId/location/:locationId/education-program/:programId/request-change",
  )
  @ApiNotFoundResponse({
    description:
      "Program to create the offering not found for the institution.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "The request is not valid or offering for given program and location not found or not in valid status.",
  })
  @ApiBadRequestResponse({
    description: "Not able to a create an offering due to an invalid request.",
  })
  async requestChange(
    @Body() payload: EducationProgramOfferingAPIInDTO,
    @Param("offeringId", ParseIntPipe) offeringId: number,
    @Param("locationId", ParseIntPipe) locationId: number,
    @Param("programId", ParseIntPipe) programId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    try {
      const saveOfferingModel =
        await this.educationProgramOfferingControllerService.getSaveOfferingModelFromOfferingAPIInDTO(
          userToken.authorizations.institutionId,
          locationId,
          programId,
          payload,
        );
      const requestedOffering = await this.programOfferingService.requestChange(
        locationId,
        programId,
        offeringId,
        userToken.userId,
        saveOfferingModel,
      );
      return { id: requestedOffering.id };
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case OFFERING_VALIDATION_CRITICAL_ERROR:
            throw new BadRequestException(error.objectInfo, error.message);
          default:
            throw new UnprocessableEntityException(error.message);
        }
      }
      throw error;
    }
  }

  /**
   * CSV with offering to be created under existing programs.
   * @param file file content with all information needed t create offerings.
   * @returns TODO: to be defined.
   */
  @IsInstitutionAdmin()
  @Post("bulk-insert")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: uploadLimits(
        MAX_UPLOAD_FILES,
        OFFERING_BULK_UPLOAD_MAX_UPLOAD_PARTS,
        OFFERING_BULK_UPLOAD_MAX_FILE_SIZE,
      ),
      fileFilter: csvFileFilter,
    }),
  )
  async bulkUpload(
    @UserToken() userToken: IInstitutionUserToken,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    const fileContent = file.buffer.toString(OFFERING_BULK_FILE_ENCODING);
    const offerings =
      await this.educationProgramOfferingBulkInsertService.generateSaveOfferingModelFromCSV(
        userToken.authorizations.institutionId,
        fileContent,
      );
    return this.educationProgramOfferingValidationService.validateOfferingModels(
      offerings,
    );
  }
}
