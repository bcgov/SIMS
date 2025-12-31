import ApiClient from "./http/ApiClient";
import {
  ApiProcessError,
  OfferingIntensity,
  OfferingsUploadBulkInsert,
  PaginatedResults,
  PaginationOptions,
} from "@/types";
import {
  OfferingAssessmentAPIInDTO,
  OfferingChangeAssessmentAPIInDTO,
  OfferingChangeRequestAPIOutDTO,
  PrecedingOfferingSummaryAPIOutDTO,
  EducationProgramOfferingAPIOutDTO,
  EducationProgramOfferingPendingAPIOutDTO,
  EducationProgramOfferingSummaryAPIOutDTO,
  EducationProgramOfferingAPIInDTO,
  OfferingDetailsAPIOutDTO,
  OptionItemAPIOutDTO,
  OfferingBulkInsertValidationResultAPIOutDTO,
  OfferingValidationResultAPIOutDTO,
  EducationProgramOfferingBasicDataAPIInDTO,
  EducationProgramOfferingSummaryViewAPIOutDTO,
} from "@/services/http/dto";
import {
  OFFERING_CREATION_CRITICAL_ERROR,
  OFFERING_VALIDATION_CRITICAL_ERROR,
  OFFERING_VALIDATION_CSV_CONTENT_FORMAT_ERROR,
} from "@/constants";
import { DATE_ONLY_ISO_FORMAT, useFormatters } from "@/composables";
import { OfferingSummaryPurpose } from "@/types/contracts/OfferingSummaryPurpose";
import { AxiosProgressEvent } from "axios";

export class EducationProgramOfferingService {
  // Share Instance
  private static instance: EducationProgramOfferingService;

  static get shared(): EducationProgramOfferingService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Validates an offering payload providing the validation result and
   * study break calculations also used to perform the validation process.
   * @param locationId location id.
   * @param programId program id.
   * @param payload offering data to be validated.
   * @returns offering validation result.
   */
  async validateOffering(
    locationId: number,
    programId: number,
    payload: EducationProgramOfferingAPIInDTO,
  ): Promise<OfferingValidationResultAPIOutDTO> {
    return ApiClient.EducationProgramOffering.validateOffering(
      locationId,
      programId,
      payload,
    );
  }

  /**
   * Creates offering.
   * @param locationId offering location.
   * @param programId offering program.
   * @param payload offering data.
   */
  async createProgramOffering(
    locationId: number,
    programId: number,
    payload: EducationProgramOfferingAPIInDTO,
  ): Promise<void> {
    await ApiClient.EducationProgramOffering.createOffering(
      locationId,
      programId,
      payload,
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
  async getOfferingsSummary(
    locationId: number,
    programId: number,
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResults<EducationProgramOfferingSummaryAPIOutDTO>> {
    return ApiClient.EducationProgramOffering.getOfferingsSummary(
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
  async getOfferingDetailsByLocationAndProgram(
    locationId: number,
    programId: number,
    offeringId: number,
  ): Promise<EducationProgramOfferingAPIOutDTO> {
    return ApiClient.EducationProgramOffering.getOfferingDetailsByLocationAndProgram(
      locationId,
      programId,
      offeringId,
    );
  }

  /**
   * Update offering.
   ** An offering which has at least one student aid application submitted
   ** cannot be modified further except the offering name. In such cases
   ** the offering must be requested for change.
   * @param locationId offering location.
   * @param programId offering program.
   * @param offeringId offering to be modified.
   * @param payload offering data to be updated.
   */
  async updateProgramOffering(
    locationId: number,
    programId: number,
    offeringId: number,
    payload: EducationProgramOfferingAPIInDTO,
  ): Promise<void> {
    await ApiClient.EducationProgramOffering.updateProgramOffering(
      locationId,
      programId,
      offeringId,
      payload,
    );
  }

  /**
   * Updates offering basic information that can be freely changed
   * without affecting the assessment.
   * @param locationId offering location.
   * @param programId offering program.
   * @param offeringId offering to be modified.
   * @param payload offering data to be updated.
   */
  async updateProgramOfferingBasicInformation(
    locationId: number,
    programId: number,
    offeringId: number,
    payload: EducationProgramOfferingBasicDataAPIInDTO,
  ): Promise<void> {
    await ApiClient.EducationProgramOffering.updateProgramOfferingBasicInformation(
      locationId,
      programId,
      offeringId,
      payload,
    );
  }

  /**
   * Get offerings for the given program and location
   * in client lookup format.
   * @param locationId offering location.
   * @param programId offering program.
   * @param programYearId program year of the offering program.
   * @param selectedIntensity offering intensity.
   * @param isIncludeInActiveProgramYear if isIncludeInActiveProgramYear is true/supplied then both active
   * and not active program year are considered.
   * @returns offerings in client lookup format.
   */
  async getProgramOfferingsOptionsList(
    locationId: number,
    programId: number,
    programYearId: number,
    selectedIntensity: OfferingIntensity,
    isIncludeInActiveProgramYear?: boolean,
  ): Promise<OptionItemAPIOutDTO[]> {
    return ApiClient.EducationProgramOffering.getProgramOfferingsOptionsList(
      locationId,
      programId,
      programYearId,
      selectedIntensity,
      isIncludeInActiveProgramYear,
    );
  }

  /**
   * Get offering details.
   * @param offeringId offering id
   * @returns offering details.
   */
  async getProgramOfferingDetails(
    offeringId: number,
  ): Promise<OfferingDetailsAPIOutDTO> {
    return ApiClient.EducationProgramOffering.getProgramOfferingDetails(
      offeringId,
    );
  }

  /**
   * Get offering details.
   * @param offeringId offering.
   * @returns offering details.
   */
  async getOfferingDetails(
    offeringId: number,
  ): Promise<EducationProgramOfferingAPIOutDTO> {
    return ApiClient.EducationProgramOffering.getOfferingDetails(offeringId);
  }

  /**
   * Assess an offering to approve or decline.
   * @param offeringId
   * @param payload
   */
  async assessOffering(
    offeringId: number,
    payload: OfferingAssessmentAPIInDTO,
  ): Promise<void> {
    return ApiClient.EducationProgramOffering.assessOffering(
      offeringId,
      payload,
    );
  }

  /**
   * Request a change to offering to modify it's
   * properties that affect the assessment of student application.
   **During this process a new offering is created by copying the existing
   * offering and modifying the properties required.
   * @param locationId location to which the offering belongs to.
   * @param programId program to which the offering belongs to.
   * @param offeringId offering to which change is requested.
   * @param payload offering data to create the new offering.
   */
  async requestChange(
    locationId: number,
    programId: number,
    offeringId: number,
    payload: EducationProgramOfferingAPIInDTO,
  ): Promise<void> {
    await ApiClient.EducationProgramOffering.requestChange(
      locationId,
      programId,
      offeringId,
      payload,
    );
  }

  /**
   * Get all offerings that were requested for change.
   * @returns all offerings that were requested for change.
   */
  async getOfferingChangeRequests(): Promise<OfferingChangeRequestAPIOutDTO[]> {
    return ApiClient.EducationProgramOffering.getOfferingChangeRequests();
  }

  /**
   * For a given offering which is requested as change
   * get the summary of it's actual(preceding) offering.
   * @param offeringId actual offering id.
   * @returns preceding offering summary.
   */
  async getPrecedingOfferingSummary(
    offeringId: number,
  ): Promise<PrecedingOfferingSummaryAPIOutDTO> {
    return ApiClient.EducationProgramOffering.getPrecedingOfferingSummary(
      offeringId,
    );
  }

  async assessOfferingChangeRequest(
    offeringId: number,
    payload: OfferingChangeAssessmentAPIInDTO,
  ): Promise<void> {
    await ApiClient.EducationProgramOffering.assessOfferingChangeRequest(
      offeringId,
      payload,
    );
  }

  /**
   * Process a CSV with offerings to be created under existing programs.
   * @param file file content with all information needed to create offerings.
   * @param validationOnly if true, will execute all validations and return the
   * errors and warnings. These validations are the same executed during the
   * final creation process. If false, the file will be processed and the records
   * will be inserted.
   * @onUploadProgress event to report the upload progress.
   * @returns a list with all validations errors and warning. Case no errors and
   * warning were found, an empty array will be returned.
   */
  async offeringBulkInsert(
    file: Blob,
    validationOnly: boolean,
    onUploadProgress: (progressEvent: AxiosProgressEvent) => void,
  ): Promise<OfferingsUploadBulkInsert[]> {
    try {
      await ApiClient.EducationProgramOffering.offeringBulkInsert(
        file,
        validationOnly,
        onUploadProgress,
      );
      return new Array<OfferingsUploadBulkInsert>();
    } catch (error: unknown) {
      // Errors that will contain records validation information that
      // must be displayed to the user.
      const bulkInsertValidationErrorTypes = [
        OFFERING_VALIDATION_CRITICAL_ERROR,
        OFFERING_VALIDATION_CSV_CONTENT_FORMAT_ERROR,
        OFFERING_CREATION_CRITICAL_ERROR,
      ];
      if (
        error instanceof ApiProcessError &&
        bulkInsertValidationErrorTypes.includes(error.errorType)
      ) {
        const apiValidationResult = error as ApiProcessError<
          OfferingBulkInsertValidationResultAPIOutDTO[]
        >;
        if (apiValidationResult.objectInfo) {
          return apiValidationResult.objectInfo.map(
            this.mapToOfferingsUploadBulkInsert,
          );
        }
      }
      throw error;
    }
  }

  /**
   * Maps the API bulk insert validation result adding formatted values to be displayed in the UI.
   * @param apiValidationResult validation result to be mapped and formatted.
   * @returns offering bulk insert validation with additional properties formatted
   * to be displayed to the UI..
   */
  private mapToOfferingsUploadBulkInsert(
    apiValidationResult: OfferingBulkInsertValidationResultAPIOutDTO,
  ): OfferingsUploadBulkInsert {
    const { dateOnlyLongString } = useFormatters();
    return {
      ...apiValidationResult,
      recordLineNumber: apiValidationResult.recordIndex + 2, // Header + zero base index.
      startDateFormatted: dateOnlyLongString(
        apiValidationResult.startDate,
        DATE_ONLY_ISO_FORMAT,
        true,
      ),
      endDateFormatted: dateOnlyLongString(
        apiValidationResult.endDate,
        DATE_ONLY_ISO_FORMAT,
        true,
      ),
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
   * @param options method options:
   * - `locationId`: location for authorization.
   * - `purpose`: indicates the purpose to allow for the appropriate authorization flow to be used.
   * @returns offering details.
   */
  async getOfferingSummaryDetailsById(
    offeringId: number,
    options?: {
      locationId?: number;
      purpose?: OfferingSummaryPurpose;
    },
  ): Promise<EducationProgramOfferingSummaryViewAPIOutDTO> {
    return ApiClient.EducationProgramOffering.getOfferingSummaryDetailsById(
      offeringId,
      options,
    );
  }

  /**
   * Gets a list of Program Offerings with status 'Creation Pending' where the Program is active/not expired.
   * Pagination, sort and search are available on results.
   * @param paginationOptions pagination options.
   * @returns pending offerings.
   */
  async getPendingOfferings(
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResults<EducationProgramOfferingPendingAPIOutDTO>> {
    return ApiClient.EducationProgramOffering.getPendingOfferings(
      paginationOptions,
    );
  }
}
