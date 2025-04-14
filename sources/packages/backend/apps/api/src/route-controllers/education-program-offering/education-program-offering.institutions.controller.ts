import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
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
import { OfferingIntensity, OfferingTypes } from "@sims/sims-db";
import {
  CreateFromValidatedOfferingError,
  EducationProgramOfferingService,
} from "../../services";
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";
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
  EducationProgramOfferingBasicDataAPIInDTO,
  EducationProgramOfferingSummaryAPIOutDTO,
  EducationProgramOfferingSummaryViewAPIOutDTO,
  OfferingValidationResultAPIOutDTO,
} from "./models/education-program-offering.dto";
import {
  csvFileFilter,
  MAX_UPLOAD_FILES,
  OFFERING_BULK_UPLOAD_MAX_FILE_SIZE,
  OFFERING_BULK_UPLOAD_MAX_UPLOAD_PARTS,
  uploadLimits,
} from "../../utilities";
import { ParseEnumQueryPipe } from "../utils/custom-validation-pipe";
import { CustomNamedError, FILE_DEFAULT_ENCODING } from "@sims/utilities";
import { FileInterceptor } from "@nestjs/platform-express";
import { EducationProgramOfferingImportCSVService } from "../../services/education-program-offering/education-program-offering-import-csv.service";
import { EducationProgramOfferingValidationService } from "../../services/education-program-offering/education-program-offering-validation.service";
import {
  OFFERING_SAVE_UNIQUE_ERROR,
  OFFERING_INVALID_OPERATION_IN_THE_CURRENT_STATE,
  OFFERING_VALIDATION_CRITICAL_ERROR,
  OFFERING_VALIDATION_CSV_PARSE_ERROR,
  EDUCATION_PROGRAM_IS_NOT_ACTIVE,
  EDUCATION_PROGRAM_IS_EXPIRED,
} from "../../constants";
import { OfferingCSVModel } from "../../services/education-program-offering/education-program-offering-import-csv.models";
import { Request } from "express";
import { InstitutionUserTypes } from "../../auth";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("education-program-offering")
@ApiTags(`${ClientTypeBaseRoute.Institution}-education-program-offering`)
export class EducationProgramOfferingInstitutionsController extends BaseController {
  constructor(
    private readonly programOfferingService: EducationProgramOfferingService,
    private readonly educationProgramOfferingControllerService: EducationProgramOfferingControllerService,
    private readonly educationProgramOfferingImportCSVService: EducationProgramOfferingImportCSVService,
    private readonly educationProgramOfferingValidationService: EducationProgramOfferingValidationService,
    private readonly offeringValidationService: EducationProgramOfferingValidationService,
  ) {
    super();
  }

  /**
   * Validates an offering payload providing the validation result and
   * study break calculations also used to perform the validation process.
   * Return a 200 HTTP status instead of 201 to indicate that the operation
   * was completed with success but no resource was created.
   * @param locationId location id.
   * @param programId program id.
   * @param payload offering data to be validated.
   * @returns offering validation result.
   */
  @HasLocationAccess("locationId", [InstitutionUserTypes.user])
  @ApiNotFoundResponse({
    description: "Not able to find the program in the provided location.",
  })
  @ApiUnprocessableEntityResponse({
    description: "The education program is not active.",
  })
  @Post("location/:locationId/education-program/:programId/validation")
  @HttpCode(HttpStatus.OK)
  async validateOffering(
    @Param("locationId", ParseIntPipe) locationId: number,
    @Param("programId", ParseIntPipe) programId: number,
    @Body() payload: EducationProgramOfferingAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
    @Req() request: Request,
  ): Promise<OfferingValidationResultAPIOutDTO> {
    const offeringValidationModel =
      await this.educationProgramOfferingControllerService.buildOfferingValidationModel(
        userToken.authorizations.institutionId,
        locationId,
        programId,
        payload,
      );
    const offeringValidation =
      this.offeringValidationService.validateOfferingModel(
        offeringValidationModel,
        true,
      );

    const calculatedStudyBreaks =
      EducationProgramOfferingService.getCalculatedStudyBreaksAndWeeks(
        offeringValidationModel,
      );

    request.res.header("Last-Modified", new Date().toString());

    return {
      offeringStatus: offeringValidation.offeringStatus,
      errors: offeringValidation.errors,
      infos: offeringValidation.infos,
      warnings: offeringValidation.warnings,
      studyPeriodBreakdown: {
        fundedStudyPeriodDays: calculatedStudyBreaks.fundedStudyPeriodDays,
        totalDays: calculatedStudyBreaks.totalDays,
        totalFundedWeeks: calculatedStudyBreaks.totalFundedWeeks,
        unfundedStudyPeriodDays: calculatedStudyBreaks.unfundedStudyPeriodDays,
      },
    };
  }

  /**
   * Create new offering.
   * @param payload offering data.
   * @param locationId offering location.
   * @param programId offering program.
   * @returns primary identifier of the created offering.
   */
  @HasLocationAccess("locationId", [InstitutionUserTypes.user])
  @ApiNotFoundResponse({
    description:
      "Program to create the offering not found for the institution or " +
      "not able to find the program in the provided location.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "Not able to a create an offering due to an invalid request or " +
      "duplication error. An offering with the same name, year of study, start date and end date was found or " +
      "the education program is not active or " +
      "the education program is expired. ",
  })
  @Post("location/:locationId/education-program/:programId")
  async createOffering(
    @Body() payload: EducationProgramOfferingAPIInDTO,
    @Param("locationId", ParseIntPipe) locationId: number,
    @Param("programId", ParseIntPipe) programId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    try {
      const offeringValidationModel =
        await this.educationProgramOfferingControllerService.buildOfferingValidationModel(
          userToken.authorizations.institutionId,
          locationId,
          programId,
          payload,
        );
      const createdProgramOffering =
        await this.programOfferingService.createEducationProgramOffering(
          offeringValidationModel,
          userToken.userId,
        );
      return { id: createdProgramOffering.id };
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case OFFERING_VALIDATION_CRITICAL_ERROR:
            throw new BadRequestException(error.objectInfo, error.message);
          case OFFERING_SAVE_UNIQUE_ERROR:
          case EDUCATION_PROGRAM_IS_NOT_ACTIVE:
          case EDUCATION_PROGRAM_IS_EXPIRED:
            throw new UnprocessableEntityException(error.message);
        }
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
  @HasLocationAccess("locationId", [InstitutionUserTypes.user])
  @ApiUnprocessableEntityResponse({
    description:
      "Either offering for the program and location is not found " +
      "or the offering is not in the appropriate state to be updated " +
      "or the request is invalid " +
      "or program is not active and the offering cannot be updated " +
      "or program is expired and the offering cannot be updated.",
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
    if (!offering.educationProgram.isActive) {
      throw new UnprocessableEntityException(
        "Program is not active and the offering cannot be updated.",
      );
    }
    if (offering.educationProgram.isExpired) {
      throw new UnprocessableEntityException(
        "Program is expired and the offering cannot be updated.",
      );
    }

    try {
      const offeringValidationModel =
        await this.educationProgramOfferingControllerService.buildOfferingValidationModel(
          userToken.authorizations.institutionId,
          locationId,
          programId,
          payload,
        );
      await this.programOfferingService.updateEducationProgramOffering(
        offeringId,
        offeringValidationModel,
        userToken.userId,
      );
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case OFFERING_INVALID_OPERATION_IN_THE_CURRENT_STATE:
          case OFFERING_SAVE_UNIQUE_ERROR:
          case EDUCATION_PROGRAM_IS_NOT_ACTIVE:
          case EDUCATION_PROGRAM_IS_EXPIRED:
            throw new UnprocessableEntityException(error.message);
          case OFFERING_VALIDATION_CRITICAL_ERROR:
            throw new BadRequestException(error.objectInfo, error.message);
        }
      }
      throw error;
    }
  }

  /**
   * Updates offering basic information that can be freely changed
   * without affecting the assessment.
   * @param payload offering data to be updated.
   * @param locationId offering location.
   * @param programId offering program.
   * @param offeringId offering to be modified.
   */
  @HasLocationAccess("locationId", [InstitutionUserTypes.user])
  @ApiUnprocessableEntityResponse({
    description:
      "Either offering for the program and location is not found or the offering is not in the appropriate status to be updated.",
  })
  @Patch(
    "location/:locationId/education-program/:programId/offering/:offeringId/basic",
  )
  async updateProgramOfferingBasicInformation(
    @UserToken() userToken: IInstitutionUserToken,
    @Param("locationId", ParseIntPipe) locationId: number,
    @Param("programId", ParseIntPipe) programId: number,
    @Param("offeringId", ParseIntPipe) offeringId: number,
    @Body() payload: EducationProgramOfferingBasicDataAPIInDTO,
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
    if (!offering.educationProgram.isActive) {
      throw new UnprocessableEntityException(
        "Program is not active and the offering cannot be updated.",
      );
    }
    if (offering.educationProgram.isExpired) {
      throw new UnprocessableEntityException(
        "Program is expired and the offering cannot be updated.",
      );
    }
    await this.programOfferingService.updateEducationProgramOfferingBasicData(
      offeringId,
      payload,
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
    return this.educationProgramOfferingControllerService.transformToProgramOfferingDTO(
      offering,
      hasExistingApplication,
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
    @Query("includeInActivePY", new DefaultValuePipe(false), ParseBoolPipe)
    includeInActivePY: boolean,
    @Query("offeringIntensity", new ParseEnumQueryPipe(OfferingIntensity))
    offeringIntensity?: OfferingIntensity,
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
  @HasLocationAccess("locationId", [InstitutionUserTypes.user])
  @Post(
    ":offeringId/location/:locationId/education-program/:programId/request-change",
  )
  @ApiNotFoundResponse({
    description:
      "Program to create the offering not found for the institution.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "The request is not valid or offering for given program and location not found or not in valid status or " +
      "the education program is not active or" +
      "the education program is expired.",
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
      const offeringValidationModel =
        await this.educationProgramOfferingControllerService.buildOfferingValidationModel(
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
        offeringValidationModel,
      );
      return { id: requestedOffering.id };
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        if (error.name === OFFERING_VALIDATION_CRITICAL_ERROR) {
          throw new BadRequestException(error.objectInfo, error.message);
        }
        throw new UnprocessableEntityException(error.message);
      }
      throw error;
    }
  }

  /**
   * Process a CSV with offerings to be created under existing programs.
   * @param file file content with all information needed to create offerings.
   * @param validationOnly if true, will execute all validations and return the
   * errors and warnings. These validations are the same executed during the
   * final creation process. If not present or false, the file will be processed
   * and the records will be inserted.
   * @returns when successfully executed, the list of all offerings ids created.
   * When an error happen it will return all the records (with the error) and
   * also a user friendly description of the errors to be fixed.
   */
  @ApiBadRequestResponse({
    description:
      "Error while parsing CSV file or " +
      "one or more CSV data fields received are not in the correct format or " +
      "there are no records to be imported.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "An offering has invalid data or " +
      "some error happen with one or more offerings being created and the entire process was aborted.",
  })
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
  async bulkInsert(
    @UserToken() userToken: IInstitutionUserToken,
    @UploadedFile() file: Express.Multer.File,
    @Query("validation-only", new DefaultValuePipe(false), ParseBoolPipe)
    validationOnly: boolean,
  ): Promise<PrimaryIdentifierAPIOutDTO[]> {
    // Read the entire file content in ASCII encoding.
    const fileContent = file.buffer.toString(FILE_DEFAULT_ENCODING);
    // Convert the file raw content into CSV models.
    let csvModels: OfferingCSVModel[];
    try {
      csvModels =
        this.educationProgramOfferingImportCSVService.readCSV(fileContent);
    } catch (error: unknown) {
      let errorMessage = "Error while parsing CSV file.";
      if (
        error instanceof CustomNamedError &&
        error.name === OFFERING_VALIDATION_CSV_PARSE_ERROR
      ) {
        errorMessage = error.message;
      }
      throw new BadRequestException(
        new ApiProcessError(errorMessage, OFFERING_VALIDATION_CSV_PARSE_ERROR),
      );
    }
    // Validate the CSV models.
    const csvValidations =
      this.educationProgramOfferingImportCSVService.validateCSVModels(
        csvModels,
      );
    // Assert successful validation.
    this.educationProgramOfferingControllerService.assertCSVValidationsAreValid(
      csvValidations,
    );
    // Convert the CSV models to the OfferingValidationModel to execute the complete offering validation.
    const offerings =
      await this.educationProgramOfferingImportCSVService.generateOfferingValidationModelFromCSVModels(
        userToken.authorizations.institutionId,
        csvModels,
      );
    // Validate all the offering models.
    const offeringValidations =
      this.educationProgramOfferingValidationService.validateOfferingModels(
        offerings,
        true,
      );
    // Assert successful validation.
    this.educationProgramOfferingControllerService.assertOfferingsValidationsAreValid(
      offeringValidations,
      csvModels,
      validationOnly,
    );

    if (validationOnly) {
      // If the endpoint is called only to perform the validation and no error was found
      // return an empty array because no record will be created.
      return [];
    }

    try {
      // Try to insert all validated offerings.
      const creationResults =
        await this.programOfferingService.createFromValidatedOfferings(
          offeringValidations,
          userToken.userId,
        );
      // Return all created ids.
      return creationResults.map((insertResult) => {
        return { id: insertResult.createdOfferingId };
      });
    } catch (error: unknown) {
      if (error instanceof CreateFromValidatedOfferingError) {
        this.educationProgramOfferingControllerService.throwFromCreationError(
          error,
          csvModels,
        );
      }
      throw error;
    }
  }

  /**
   * Gets the offering simplified details, not including, for instance,
   * validations, approvals and extensive data.
   * Useful to have an overview of the offering details, for instance,
   * when the user needs need to have quick access to data in order to
   * support operations like confirmation of enrolment or scholastic
   * standing requests or offering change request.
   * @param offeringId offering.
   * @param locationId offering location.
   * @returns offering details.
   */
  @HasLocationAccess("locationId")
  @ApiNotFoundResponse({
    description: "Not able to find the Education Program offering.",
  })
  @Get("location/:locationId/offering/:offeringId/summary-details")
  async getOfferingSummaryDetailsById(
    @Param("offeringId", ParseIntPipe) offeringId: number,
    @Param("locationId", ParseIntPipe) locationId: number,
  ): Promise<EducationProgramOfferingSummaryViewAPIOutDTO> {
    return this.educationProgramOfferingControllerService.getOfferingById(
      offeringId,
      { locationId },
    );
  }
}
