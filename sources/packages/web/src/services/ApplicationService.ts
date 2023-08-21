import {
  DataTableSortOrder,
  StudentApplicationFields,
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_NUMBER,
  ApiProcessError,
} from "@/types";
import ApiClient from "../services/http/ApiClient";
import {
  ApplicationSummaryAPIOutDTO,
  PaginatedResultsAPIOutDTO,
  InProgressApplicationDetailsAPIOutDTO,
  SaveApplicationAPIInDTO,
  ApplicationWithProgramYearAPIOutDTO,
  ApplicationDataAPIOutDTO,
  ApplicationBaseAPIOutDTO,
  ApplicationIdentifiersAPIOutDTO,
  PrimaryIdentifierAPIOutDTO,
  ApplicationProgressDetailsAPIOutDTO,
  EnrolmentApplicationDetailsAPIOutDTO,
  CompletedApplicationDetailsAPIOutDTO,
  ApplicationBulkWithdrawalValidationResultAPIOutDTO,
} from "@/services/http/dto";
import { FileUploadProgressEventArgs } from "./http/common/FileUploadProgressEvent";
import { ApplicationBulkWithdrawal } from "@/types/contracts/institution/Application";
import { DATE_ONLY_ISO_FORMAT, useFormatters } from "@/composables";
import {
  APPLICATION_WITHDRAWAL_INVALID_TEXT_FILE_ERROR,
  APPLICATION_WITHDRAWAL_TEXT_CONTENT_FORMAT_ERROR,
} from "@/constants";

export class ApplicationService {
  // Share Instance
  private static instance: ApplicationService;

  static get shared(): ApplicationService {
    return this.instance || (this.instance = new this());
  }

  async cancelStudentApplication(applicationId: number): Promise<void> {
    await ApiClient.Application.cancelStudentApplication(applicationId);
  }

  async getApplicationData(
    applicationId: number,
  ): Promise<ApplicationDataAPIOutDTO> {
    return ApiClient.Application.getApplicationData(applicationId);
  }

  async createApplicationDraft(
    payload: SaveApplicationAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    return ApiClient.Application.createApplicationDraft(payload);
  }

  async saveApplicationDraft(
    applicationId: number,
    payload: SaveApplicationAPIInDTO,
  ): Promise<void> {
    await ApiClient.Application.saveApplicationDraft(applicationId, payload);
  }

  async submitApplication(
    applicationId: number,
    payload: SaveApplicationAPIInDTO,
  ): Promise<void> {
    await ApiClient.Application.submitApplication(applicationId, payload);
  }

  async getApplicationWithPY(
    applicationId: number,
    isIncludeInActiveProgramYear?: boolean,
  ): Promise<ApplicationWithProgramYearAPIOutDTO> {
    return ApiClient.Application.getApplicationWithPY(
      applicationId,
      isIncludeInActiveProgramYear,
    );
  }

  /**
   * Get application detail of given application.
   * @param applicationId for the application.
   * @param studentId for the student.
   * @returns application details.
   */
  async getApplicationDetail(
    applicationId: number,
    studentId?: number,
  ): Promise<ApplicationBaseAPIOutDTO> {
    return ApiClient.Application.getApplicationDetails(
      applicationId,
      studentId,
    );
  }

  /**
   * Get the list of applications that belongs to a student on a summary view format.
   * @param page page number.
   * @param pageCount limit of the page.
   * @param sortField field to be sorted.
   * @param sortOrder order to be sorted.
   * @param studentId student id. Used only for AEST.
   * @returns student application list with total count.
   */
  async getStudentApplicationSummary(
    page = DEFAULT_PAGE_NUMBER,
    pageCount = DEFAULT_PAGE_LIMIT,
    sortField?: StudentApplicationFields,
    sortOrder?: DataTableSortOrder,
    studentId?: number,
  ): Promise<PaginatedResultsAPIOutDTO<ApplicationSummaryAPIOutDTO>> {
    return ApiClient.Application.getStudentApplicationSummary(
      page,
      pageCount,
      sortField,
      sortOrder,
      studentId,
    );
  }

  async getApplicationForRequestChange(
    applicationNumber: string,
  ): Promise<ApplicationIdentifiersAPIOutDTO> {
    return ApiClient.Application.getApplicationForRequestChange(
      applicationNumber,
    );
  }

  /**
   * Get in progress details of an application by application id.
   * @param applicationId application id.
   * @returns application details.
   */
  async getInProgressApplicationDetails(
    applicationId: number,
  ): Promise<InProgressApplicationDetailsAPIOutDTO> {
    return ApiClient.Application.getInProgressApplicationDetails(applicationId);
  }

  /**
   * Get status of all requests and confirmations in student application (Exception, PIR and COE).
   * @param applicationId Student application.
   * @returns application progress details.
   */
  async getApplicationProgressDetails(
    applicationId: number,
  ): Promise<ApplicationProgressDetailsAPIOutDTO> {
    return ApiClient.Application.getApplicationProgressDetails(applicationId);
  }

  /**
   * Get details for the application enrolment status of a student application.
   * @param applicationId student application id.
   * @returns details for the application enrolment status.
   */
  async getEnrolmentApplicationDetails(
    applicationId: number,
  ): Promise<EnrolmentApplicationDetailsAPIOutDTO> {
    return ApiClient.Application.getEnrolmentApplicationDetails(applicationId);
  }

  /**
   * Get details for an application on at completed status.
   * @param applicationId application id.
   * @returns details for an application on at completed status.
   */
  async getCompletedApplicationDetails(
    applicationId: number,
  ): Promise<CompletedApplicationDetailsAPIOutDTO> {
    return ApiClient.Application.getCompletedApplicationDetails(applicationId);
  }

  /**
   * Creates a new MSFAA number to be associated with the student, cancelling any
   * pending MSFAA for the particular offering intensity and also associating the
   * new MSFAA number to any pending disbursement for the same offering intensity.
   * @param applicationId reference application id.
   */
  async reissueMSFAA(applicationId: number): Promise<void> {
    await ApiClient.Application.reissueMSFAA(applicationId);
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
    onUploadProgress: (progressEvent: FileUploadProgressEventArgs) => void,
  ): Promise<ApplicationBulkWithdrawal[]> {
    try {
      await ApiClient.Application.applicationBulkWithdrawal(
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
