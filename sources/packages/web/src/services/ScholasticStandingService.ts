import { DATE_ONLY_ISO_FORMAT, useFormatters } from "@/composables";
import ApiClient from "@/services/http/ApiClient";
import {
  ApplicationBulkWithdrawalValidationResultAPIOutDTO,
  ScholasticStandingDataAPIInDTO,
  ScholasticStandingSubmittedDetailsAPIOutDTO,
  ScholasticStandingSummaryDetailsAPIOutDTO,
} from "@/services/http/dto";
import { ApplicationBulkWithdrawal } from "@/types/contracts/institution/ScholasticStanding";
import {
  APPLICATION_WITHDRAWAL_VALIDATION_ERROR,
  APPLICATION_WITHDRAWAL_INVALID_TEXT_FILE_ERROR,
  APPLICATION_WITHDRAWAL_TEXT_CONTENT_FORMAT_ERROR,
} from "@/constants";
import { ApiProcessError } from "@/types";
import { AxiosProgressEvent } from "axios";

/**
 * Client service layer for Scholastic standing.
 */
export class ScholasticStandingService {
  // Shared Instance
  private static instance: ScholasticStandingService;

  public static get shared(): ScholasticStandingService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Get Scholastic Standing submitted details.
   * @param scholasticStandingId scholastic standing id.
   * @returns Scholastic Standing.
   */
  async getScholasticStanding(
    scholasticStandingId: number,
  ): Promise<ScholasticStandingSubmittedDetailsAPIOutDTO> {
    const { dateOnlyLongString } = useFormatters();
    const applicationDetails =
      await ApiClient.ScholasticStandingApi.getScholasticStanding(
        scholasticStandingId,
      );

    return {
      ...applicationDetails,
      applicationOfferingStartDate: dateOnlyLongString(
        applicationDetails.applicationOfferingStartDate,
      ),
      applicationOfferingEndDate: dateOnlyLongString(
        applicationDetails.applicationOfferingEndDate,
      ),
      studyStartDate: applicationDetails.applicationOfferingStartDate,
      studyEndDate: applicationDetails.applicationOfferingEndDate,
      applicationOfferingStudyBreak:
        applicationDetails.applicationOfferingStudyBreak?.map((studyBreak) => ({
          breakStartDate: dateOnlyLongString(studyBreak.breakStartDate),
          breakEndDate: dateOnlyLongString(studyBreak.breakEndDate),
        })),
    };
  }

  /**
   * Get Scholastic Standing Summary details.
   * @param options options for the scholastic standing summary.
   * - `studentId` student id to retrieve the scholastic standing summary.
   * @returns Scholastic Standing Summary.
   */
  async getScholasticStandingSummary(options?: {
    studentId?: number;
  }): Promise<ScholasticStandingSummaryDetailsAPIOutDTO> {
    return ApiClient.ScholasticStandingApi.getScholasticStandingSummary({
      studentId: options?.studentId,
    });
  }

  /**
   * Save scholastic standing and create new assessment.
   * @param applicationId application id.
   * @param locationId location id.
   * @param payload scholasticStanding payload.
   */
  async saveScholasticStanding(
    applicationId: number,
    locationId: number,
    payload: ScholasticStandingDataAPIInDTO,
  ): Promise<void> {
    await ApiClient.ScholasticStandingApi.saveScholasticStanding(
      applicationId,
      locationId,
      payload,
    );
  }

  /**
   * Process the given text file with application withdrawal.
   * @param file file content with all information needed to withdraw application.
   * @param validationOnly if true, will execute all validations and return the
   * errors and warnings. These validations are the same executed during the
   * final creation process. If false, the file will be processed and the records
   * will be inserted.
   * @onUploadProgress event to report the upload progress.
   * @returns a list with all validations errors and warning. Case no errors and
   * warning were found, an empty array will be returned.
   */
  async applicationBulkWithdrawal(
    file: Blob,
    validationOnly: boolean,
    onUploadProgress: (progressEvent: AxiosProgressEvent) => void,
  ): Promise<ApplicationBulkWithdrawal[]> {
    try {
      await ApiClient.ScholasticStandingApi.applicationBulkWithdrawal(
        file,
        validationOnly,
        onUploadProgress,
      );
      return new Array<ApplicationBulkWithdrawal>();
    } catch (error: unknown) {
      // Errors that will contain records validation information that
      // must be displayed to the user.
      const bulkInsertValidationErrorTypes = [
        APPLICATION_WITHDRAWAL_TEXT_CONTENT_FORMAT_ERROR,
        APPLICATION_WITHDRAWAL_INVALID_TEXT_FILE_ERROR,
        APPLICATION_WITHDRAWAL_VALIDATION_ERROR,
      ];
      if (
        error instanceof ApiProcessError &&
        bulkInsertValidationErrorTypes.includes(error.errorType)
      ) {
        const apiValidationResult = error as ApiProcessError<
          ApplicationBulkWithdrawalValidationResultAPIOutDTO[]
        >;
        if (apiValidationResult.objectInfo) {
          return apiValidationResult.objectInfo.map(
            this.mapToApplicationBulkWithdrawal,
          );
        }
      }
      throw error;
    }
  }

  /**
   * Maps the API application bulk withdrawal result adding formatted values to be displayed in the UI.
   * @param apiValidationResult validation result to be mapped and formatted.
   * @returns application bulk withdrawal validation with additional properties formatted
   * to be displayed to the UI.
   */
  private mapToApplicationBulkWithdrawal(
    apiValidationResult: ApplicationBulkWithdrawalValidationResultAPIOutDTO,
  ): ApplicationBulkWithdrawal {
    const { dateOnlyLongString } = useFormatters();
    return {
      ...apiValidationResult,
      recordLineNumber: apiValidationResult.recordIndex + 2, // Header + zero base index.
      withdrawalDateFormatted: dateOnlyLongString(
        apiValidationResult.withdrawalDate,
        DATE_ONLY_ISO_FORMAT,
        true,
      ),
    };
  }
}
