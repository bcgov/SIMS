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
  EducationProgramOfferingSummaryAPIOutDTO,
  EducationProgramOfferingAPIInDTO,
  OfferingStartDateAPIOutDTO,
  OptionItemAPIOutDTO,
  OfferingBulkInsertValidationResultAPIOutDTO,
} from "@/services/http/dto";
import {
  OFFERING_CREATION_CRITICAL_ERROR,
  OFFERING_VALIDATION_CRITICAL_ERROR,
  OFFERING_VALIDATION_CSV_CONTENT_FORMAT_ERROR,
} from "@/constants";
import { DATE_ONLY_ISO_FORMAT, useFormatters } from "@/composables";
import { FileUploadProgressEventArgs } from "@/services/http/common/FileUploadProgressEvent";

export class EducationProgramOfferingService {
  // Share Instance
  private static instance: EducationProgramOfferingService;

  public static get shared(): EducationProgramOfferingService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Creates offering.
   * @param locationId offering location.
   * @param programId offering program.
   * @param payload offering data.
   */
  public async createProgramOffering(
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
  public async getOfferingsSummary(
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
  public async getOfferingDetailsByLocationAndProgram(
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
   * @param payload offering data to be updated.
   * @param locationId offering location.
   * @param programId offering program.
   * @param offeringId offering to be modified.
   */
  public async updateProgramOffering(
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
  public async getProgramOfferingsOptionsList(
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
   * Get offering start date of a given offering.
   * @param offeringId offering id
   * @returns offering with start date value.
   */
  public async getProgramOfferingStartDate(
    offeringId: number,
  ): Promise<OfferingStartDateAPIOutDTO> {
    return ApiClient.EducationProgramOffering.getProgramOfferingStartDate(
      offeringId,
    );
  }

  /**
   * Get offering details.
   * @param offeringId offering.
   * @returns offering details.
   */
  public async getOfferingDetails(
    offeringId: number,
  ): Promise<EducationProgramOfferingAPIOutDTO> {
    return ApiClient.EducationProgramOffering.getOfferingDetails(offeringId);
  }

  /**
   * Assess an offering to approve or decline.
   * @param offeringId
   * @param payload
   */
  public async assessOffering(
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
   * @param locationId
   * @param programId
   * @param offeringId
   * @param payload
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

  /**
   * For a given offering which is requested as change
   * get the details of it's actual(preceding) offering.
   * @param offeringId actual offering id.
   * @returns preceding offering details.
   */
  async getPrecedingOfferingByActualOfferingId(
    offeringId: number,
  ): Promise<EducationProgramOfferingAPIOutDTO> {
    return ApiClient.EducationProgramOffering.getPrecedingOfferingByActualOfferingId(
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
    onUploadProgress: (progressEvent: FileUploadProgressEventArgs) => void,
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
}
