import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  EDUCATION_PROGRAM_IS_EXPIRED,
  EDUCATION_PROGRAM_IS_NOT_ACTIVE,
  OFFERING_CREATION_CRITICAL_ERROR,
  OFFERING_VALIDATION_CRITICAL_ERROR,
  OFFERING_VALIDATION_CSV_CONTENT_FORMAT_ERROR,
} from "../../constants";
import {
  OfferingCSVModel,
  OfferingCSVValidationResult,
} from "../../services/education-program-offering/education-program-offering-import-csv.models";
import { ApiProcessError } from "../../types";
import {
  EducationProgramOffering,
  OfferingIntensity,
  OfferingStatus,
  OfferingTypes,
} from "@sims/sims-db";
import {
  EducationProgramOfferingService,
  EducationProgramService,
  OfferingValidationResult,
  OfferingValidationModel,
  CreateFromValidatedOfferingError,
  InstitutionLocationService,
} from "../../services";
import {
  deliveryMethod,
  getOfferingNameAndPeriod,
  getUserFullName,
} from "../../utilities";
import { OptionItemAPIOutDTO } from "../models/common.dto";
import {
  OfferingsPaginationOptionsAPIInDTO,
  PaginatedResultsAPIOutDTO,
} from "../models/pagination.dto";
import {
  EducationProgramOfferingAPIInDTO,
  EducationProgramOfferingAPIOutDTO,
  EducationProgramOfferingSummaryAPIOutDTO,
  EducationProgramOfferingSummaryViewAPIOutDTO,
  OfferingBulkInsertValidationResultAPIOutDTO,
} from "./models/education-program-offering.dto";

@Injectable()
export class EducationProgramOfferingControllerService {
  constructor(
    private readonly offeringService: EducationProgramOfferingService,
    private readonly programService: EducationProgramService,
    private readonly programOfferingService: EducationProgramOfferingService,
    private readonly institutionLocationService: InstitutionLocationService,
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
        yearOfStudy: offering.yearOfStudy,
        studyStartDate: offering.studyStartDate,
        studyEndDate: offering.studyEndDate,
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
  async buildOfferingValidationModel(
    institutionId: number,
    locationId: number,
    programId: number,
    payload: EducationProgramOfferingAPIInDTO,
  ): Promise<OfferingValidationModel> {
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
    if (!program.isActive) {
      throw new UnprocessableEntityException(
        "The education program is not active.",
        EDUCATION_PROGRAM_IS_NOT_ACTIVE,
      );
    }
    if (!program.isExpired) {
      throw new UnprocessableEntityException(
        "The education program is expired.",
        EDUCATION_PROGRAM_IS_EXPIRED,
      );
    }
    // Get institution location details.
    const institutionLocation =
      await this.institutionLocationService.getInstitutionLocation(locationId);
    return {
      ...payload,
      locationId,
      locationName: institutionLocation.name,
      operatingName: institutionLocation.institution.operatingName,
      legalOperatingName: institutionLocation.institution.legalOperatingName,
      primaryEmail: institutionLocation.institution.primaryEmail,
      studyBreaks: payload.studyBreaks,
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
          infos: [],
          warnings: [],
        }));
      throw new BadRequestException(
        new ApiProcessError(
          "One or more CSV data fields received are not in the correct format.",
          OFFERING_VALIDATION_CSV_CONTENT_FORMAT_ERROR,
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
   * @param considerWarningsAsErrors if true, a warning will be considered as an error also,
   * otherwise only errors in the errors array will be considered errors.
   */
  assertOfferingsValidationsAreValid(
    offeringValidations: OfferingValidationResult[],
    csvModels: OfferingCSVModel[],
    considerWarningsAsErrors = false,
  ) {
    const offeringValidationsErrors = offeringValidations.filter(
      (offering) =>
        offering.errors.length ||
        (considerWarningsAsErrors && offering.warnings.length),
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
            offeringStatus: validation.offeringStatus,
            errors: validation.errors,
            infos: validation.infos.map((info) => ({
              typeCode: info.typeCode,
              message: info.message,
            })),
            warnings: validation.warnings.map((warning) => ({
              typeCode: warning.typeCode,
              message: warning.message,
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
   * Converts the service error into the HTTP bulk upload error.
   * @param error error to generate the HTTP error.
   * @param csvModels reference CSV models to provide extra context in case
   * an error must be generated.
   */
  throwFromCreationError(
    error: CreateFromValidatedOfferingError,
    csvModels: OfferingCSVModel[],
  ) {
    const csvModel = csvModels[error.validatedOffering.index];
    const validationResults: OfferingBulkInsertValidationResultAPIOutDTO[] = [
      {
        recordIndex: error.validatedOffering.index,
        locationCode: csvModel.institutionLocationCode,
        sabcProgramCode: csvModel.sabcProgramCode,
        startDate: error.validatedOffering.offeringModel.studyStartDate,
        endDate: error.validatedOffering.offeringModel.studyEndDate,
        errors: [error.error],
        infos: [],
        warnings: [],
      },
    ];
    throw new UnprocessableEntityException(
      new ApiProcessError(
        "Some error happen with one or more offerings being created and the entire process was aborted. No offering was added and the upload can be executed again once the error is fixed.",
        OFFERING_CREATION_CRITICAL_ERROR,
        validationResults,
      ),
    );
  }

  /**
   * Transformation util for Program Offering.
   * @param offering to be transformed.
   * @param hasExistingApplication is the offering linked to any application.
   * @returns program offering.
   */
  async transformToProgramOfferingDTO(
    offering: EducationProgramOffering,
    hasExistingApplication?: boolean,
  ): Promise<EducationProgramOfferingAPIOutDTO> {
    const validatedOffering = await this.offeringService.validateOfferingById(
      offering.id,
    );

    return {
      id: offering.id,
      offeringName: offering.name,
      studyStartDate: offering.studyStartDate,
      studyEndDate: offering.studyEndDate,
      actualTuitionCosts: offering.actualTuitionCosts,
      programRelatedCosts: offering.programRelatedCosts,
      mandatoryFees: offering.mandatoryFees,
      exceptionalExpenses: offering.exceptionalExpenses,
      offeringDelivered: offering.offeringDelivered,
      lacksStudyBreaks: offering.lacksStudyBreaks,
      offeringIntensity: offering.offeringIntensity,
      yearOfStudy: offering.yearOfStudy,
      hasOfferingWILComponent: offering.hasOfferingWILComponent,
      offeringWILComponentType: offering.offeringWILType,
      studyBreaks: offering.studyBreaks?.studyBreaks,
      studyPeriodBreakdown: {
        fundedStudyPeriodDays: offering.studyBreaks?.fundedStudyPeriodDays,
        totalDays: offering.studyBreaks?.totalDays,
        totalFundedWeeks: offering.studyBreaks?.totalFundedWeeks,
        unfundedStudyPeriodDays: offering.studyBreaks?.unfundedStudyPeriodDays,
      },
      offeringDeclaration: offering.offeringDeclaration,
      submittedDate: offering.submittedDate,
      offeringStatus: offering.offeringStatus,
      precedingOfferingId: offering.precedingOffering?.id,
      offeringType: offering.offeringType,
      locationName: offering.institutionLocation.name,
      institutionId: offering.institutionLocation.institution.id,
      institutionName: offering.institutionLocation.institution.operatingName,
      assessedBy: getUserFullName(offering.assessedBy),
      assessedDate: offering.assessedDate,
      courseLoad: offering.courseLoad,
      hasExistingApplication,
      validationInfos: validatedOffering.infos.map((info) => info.typeCode),
      validationWarnings: validatedOffering.warnings.map(
        (warning) => warning.typeCode,
      ),
      parentOfferingId: offering.parentOffering.id,
    };
  }

  /**
   * Gets the offering simplified details, not including, for instance,
   * validations, approvals and extensive data.
   * Useful to have an overview of the offering details, for instance,
   * when the user needs need to have quick access to data in order to
   * support operations like confirmation of enrolment or scholastic
   * standing requests or offering change request.
   * @param offeringId offering id.
   * @param options method options:
   * - `locationId`: location for authorization.
   * @returns education program offering.
   */
  async getOfferingById(
    offeringId: number,
    options?: {
      locationId?: number;
    },
  ): Promise<EducationProgramOfferingSummaryViewAPIOutDTO> {
    const offering = await this.programOfferingService.getOfferingById(
      offeringId,
      { locationId: options?.locationId },
    );
    if (!offering) {
      throw new NotFoundException(
        "Not able to find the Education Program offering.",
      );
    }
    const program = offering.educationProgram;
    return {
      id: offering.id,
      offeringName: offering.name,
      studyStartDate: offering.studyStartDate,
      studyEndDate: offering.studyEndDate,
      actualTuitionCosts: offering.actualTuitionCosts,
      programRelatedCosts: offering.programRelatedCosts,
      mandatoryFees: offering.mandatoryFees,
      exceptionalExpenses: offering.exceptionalExpenses,
      offeringDelivered: offering.offeringDelivered,
      lacksStudyBreaks: offering.lacksStudyBreaks,
      offeringIntensity: offering.offeringIntensity,
      studyBreaks: offering.studyBreaks?.studyBreaks,
      locationName: offering.institutionLocation.name,
      programId: program.id,
      programName: program.name,
      programDescription: program.description,
      programCredential: program.credentialType,
      programDelivery: deliveryMethod(
        program.deliveredOnline,
        program.deliveredOnSite,
      ),
    };
  }
}
