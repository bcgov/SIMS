import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  OFFERING_CREATION_CRITICAL_ERROR,
  OFFERING_VALIDATION_CRITICAL_ERROR,
  OFFERING_VALIDATION_CSV_FORMAT_ERROR,
} from "../../constants";
import {
  OfferingCSVModel,
  OfferingCSVValidationResult,
} from "../../services/education-program-offering/education-program-offering-import-csv.models";
import { ApiProcessError } from "../../types";
import {
  OfferingIntensity,
  OfferingStatus,
  OfferingTypes,
} from "../../database/entities";
import {
  CreateValidatedOfferingResult,
  EducationProgramOfferingService,
  EducationProgramService,
  OfferingValidationResult,
  SaveOfferingModel,
} from "../../services";
import {
  getISODateOnlyString,
  getOfferingNameAndPeriod,
} from "../../utilities";
import { OptionItemAPIOutDTO } from "../models/common.dto";
import {
  OfferingsPaginationOptionsAPIInDTO,
  PaginatedResultsAPIOutDTO,
} from "../models/pagination.dto";
import {
  EducationProgramOfferingAPIInDTO,
  EducationProgramOfferingSummaryAPIOutDTO,
  OfferingBulkInsertValidationResultAPIOutDTO,
} from "./models/education-program-offering.dto";

@Injectable()
export class EducationProgramOfferingControllerService {
  constructor(
    private readonly offeringService: EducationProgramOfferingService,
    private readonly programService: EducationProgramService,
  ) {}

  /**
   * Get summary of offerings for a program and location.
   * Pagination, sort and search are available on results.
   * @param locationId offering location.
   * @param programId offering program.
   * @param paginationOptions pagination options.
   * @returns offering summary results.
   */
  async getOfferingsSummary(
    locationId: number,
    programId: number,
    paginationOptions: OfferingsPaginationOptionsAPIInDTO,
  ): Promise<
    PaginatedResultsAPIOutDTO<EducationProgramOfferingSummaryAPIOutDTO>
  > {
    // To retrieve Education program offering corresponding to ProgramId and LocationId
    // [OfferingTypes.Private] offerings are
    // created during PIR, if required, and they are supposed
    // to be viewed only associated to the application that they
    // were associated to during the PIR, hence they should not
    // be displayed alongside with the public offerings.
    const offerings = await this.offeringService.getAllEducationProgramOffering(
      locationId,
      programId,
      paginationOptions,
      [OfferingTypes.Public, OfferingTypes.Private],
    );

    return {
      results: offerings.results.map((offering) => ({
        id: offering.id,
        name: offering.name,
        studyStartDate: getISODateOnlyString(offering.studyStartDate),
        studyEndDate: getISODateOnlyString(offering.studyEndDate),
        offeringDelivered: offering.offeringDelivered,
        offeringIntensity: offering.offeringIntensity,
        offeringType: offering.offeringType,
        offeringStatus: offering.offeringStatus,
      })),
      count: offerings.count,
    };
  }

  /**
   * Get offerings for the given program and location
   * in client lookup format.
   * @param locationId offering location.
   * @param programId offering program.
   * @param programYearId program year of the offering program.
   * @param offeringTypes offering types to be filtered.
   * @param offeringIntensity offering intensity.
   * @param includeInActivePY if includeInActivePY is true/supplied then both active
   * and not active program year are considered.
   * @returns offerings in client lookup format.
   */
  async getProgramOfferingsOptionsList(
    locationId: number,
    programId: number,
    programYearId: number,
    offeringTypes: OfferingTypes[],
    includeInActivePY: boolean,
    offeringIntensity?: OfferingIntensity,
  ): Promise<OptionItemAPIOutDTO[]> {
    if (
      offeringIntensity &&
      !Object.values(OfferingIntensity).includes(offeringIntensity)
    ) {
      throw new UnprocessableEntityException("Invalid offering intensity.");
    }
    const offeringsFilter = {
      offeringIntensity,
      offeringStatus: OfferingStatus.Approved,
      offeringTypes,
    };
    const offerings = await this.offeringService.getProgramOfferingsForLocation(
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
   * Creates the offering model to be validated and saved using the DTO received.
   * @param institutionId institution id.
   * @param locationId location id.
   **The authorization to validated if the location belongs to the institution
   **is not expected to be performed by this method.
   * @param programId program id.
   * @param payload information to generate the model to perform the offering
   * validation and persistence.
   * @returns offering model to be validated and saved.
   */
  async mapOfferingAPIInDTOTOSaveOfferingModel(
    institutionId: number,
    locationId: number,
    programId: number,
    payload: EducationProgramOfferingAPIInDTO,
  ): Promise<SaveOfferingModel> {
    // Program information required to perform the offering validations.
    const program = await this.programService.getEducationProgramDetails(
      programId,
      institutionId,
    );
    if (!program) {
      throw new NotFoundException(
        "Program to create the offering not found for the institution.",
      );
    }
    return {
      ...payload,
      locationId,
      studyBreaks: payload.breaksAndWeeks?.studyBreaks,
      programContext: program,
    };
  }

  /**
   * Verify if all CSV validations were performed with success and throw
   * a BadRequestException in case of some failure.
   * @param csvValidations validations to be verified.
   */
  assertCSVValidationsAreValid(csvValidations: OfferingCSVValidationResult[]) {
    const csvValidationsErrors = csvValidations.filter(
      (csvValidation) => csvValidation.errors.length,
    );
    if (csvValidationsErrors.length) {
      // At least one error was detected and the CSV must be fixed.
      const validationResults: OfferingBulkInsertValidationResultAPIOutDTO[] =
        csvValidationsErrors.map((validation) => ({
          recordIndex: validation.index,
          locationCode: validation.csvModel.institutionLocationCode,
          sabcProgramCode: validation.csvModel.sabcProgramCode,
          startDate: validation.csvModel.studyStartDate,
          endDate: validation.csvModel.studyEndDate,
          errors: validation.errors,
          warnings: [],
        }));
      throw new BadRequestException(
        new ApiProcessError(
          "Some CSV data field received is not in correct format.",
          OFFERING_VALIDATION_CSV_FORMAT_ERROR,
          validationResults,
        ),
      );
    }
  }

  /**
   * Verify if all offerings validations were performed with success and throw
   * a UnprocessableEntityException in case of some failure.
   * @param offeringValidations validations to be verified.
   * @param csvModels reference CSV models to provide extra context in case
   * an error must be generated.
   */
  assertOfferingsValidationsAreValid(
    offeringValidations: OfferingValidationResult[],
    csvModels: OfferingCSVModel[],
  ) {
    const offeringValidationsErrors = offeringValidations.filter(
      (offering) => offering.errors.length,
    );
    if (offeringValidationsErrors.length) {
      // There is some critical validation error that will prevent some offering to be inserted.
      const validationResults: OfferingBulkInsertValidationResultAPIOutDTO[] =
        offeringValidationsErrors.map((validation) => {
          const csvModel = csvModels[validation.index];
          return {
            recordIndex: validation.index,
            locationCode: csvModel.institutionLocationCode,
            sabcProgramCode: csvModel.sabcProgramCode,
            startDate: validation.offeringModel.studyStartDate,
            endDate: validation.offeringModel.studyEndDate,
            errors: validation.errors,
            warnings: validation.warnings.map((warning) => ({
              warningType: warning.warningType,
              warningMessage: warning.warningMessage,
            })),
          };
        });
      throw new UnprocessableEntityException(
        new ApiProcessError(
          "An offering has invalid data.",
          OFFERING_VALIDATION_CRITICAL_ERROR,
          validationResults,
        ),
      );
    }
  }

  /**
   * Verify if all offerings were successfully inserted and throw
   * an UnprocessableEntityException in case of some failure.
   * @param creationResults insert results from all the offerings.
   * @param csvModels reference CSV models to provide extra context in case
   * an error must be generated.
   */
  assertOfferingsCreationsAreAllSuccessful(
    creationResults: CreateValidatedOfferingResult[],
    csvModels: OfferingCSVModel[],
  ) {
    const creationErrors = creationResults.filter(
      (creationResult) => !creationResult.success,
    );
    if (creationErrors.length) {
      // If there is any failed result throw an error.
      const validationResults: OfferingBulkInsertValidationResultAPIOutDTO[] =
        creationErrors.map((creationError) => {
          const csvModel = csvModels[creationError.validatedOffering.index];
          return {
            recordIndex: creationError.validatedOffering.index,
            locationCode: csvModel.institutionLocationCode,
            sabcProgramCode: csvModel.sabcProgramCode,
            startDate:
              creationError.validatedOffering.offeringModel.studyStartDate,
            endDate: creationError.validatedOffering.offeringModel.studyEndDate,
            errors: [creationError.error],
            warnings: [],
          };
        });
      throw new UnprocessableEntityException(
        new ApiProcessError(
          "Some error happen with one or more offerings being created and the entire process was aborted. No offering was added and the upload can be executed again once the error is fixed.",
          OFFERING_CREATION_CRITICAL_ERROR,
          validationResults,
        ),
      );
    }
  }
}
