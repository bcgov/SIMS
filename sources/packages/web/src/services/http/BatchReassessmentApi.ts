import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  BatchReassessmentAPIInDTO,
  BatchReassessmentApplicationAPIOutDTO,
  BatchReassessmentSummaryAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";
import { BatchReassessmentApplicationResult, PaginationOptions } from "@/types";

/**
 * Http API client for Batch Reassessments.
 */
export class BatchReassessmentApi extends HttpBaseClient {
  /**
   * Creates a batch reassessment for the given application numbers.
   * @param payload application numbers to be reassessed.
   */
  async createBatchReassessment(
    payload: BatchReassessmentAPIInDTO,
  ): Promise<void> {
    await this.postCall(this.addClientRoot("batch-reassessment"), payload);
  }

  /**
   * Gets batch manual reassessment submissions.
   * @returns batch manual reassessment submissions.
   */
  async getBatchReassessments(): Promise<BatchReassessmentSummaryAPIOutDTO[]> {
    return this.getCall(this.addClientRoot("batch-reassessment"));
  }

  /**
   * Gets the reassessment outcome of each application in a batch manual reassessment.
   * TODO: Stubbed data, replace with the call below once the API endpoint is available.
   * `batch-reassessment/${batchReassessmentId}/applications?${getPaginationQueryString(paginationOptions)}`
   * @param _batchReassessmentId batch manual reassessment ID.
   * @param paginationOptions pagination options, with optional search criteria
   * `applicationNumber` and `result`.
   * @returns paginated application outcomes ordered by application number.
   */
  async getBatchReassessmentApplications(
    _batchReassessmentId: number,
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResultsAPIOutDTO<BatchReassessmentApplicationAPIOutDTO>> {
    const searchCriteria = (paginationOptions.searchCriteria ?? {}) as Record<
      string,
      string
    >;
    const filtered = STUB_BATCH_REASSESSMENT_APPLICATIONS.filter(
      (application) =>
        (!searchCriteria.result ||
          application.result === searchCriteria.result) &&
        (!searchCriteria.applicationNumber ||
          application.applicationNumber.includes(
            searchCriteria.applicationNumber,
          )),
    ).sort((a, b) => a.applicationNumber.localeCompare(b.applicationNumber));
    const start = (paginationOptions.page - 1) * paginationOptions.pageLimit;
    return {
      results: filtered.slice(start, start + paginationOptions.pageLimit),
      count: filtered.length,
    };
  }
}

/**
 * TODO: Remove once the API endpoint is available.
 */
const STUB_FAILURE_REASONS = [
  "The application does not have a valid assessment calculation.",
  "The application is date archived and not eligible.",
  "The application is cancelled and not eligible.",
  "The application number does not exist.",
  "The application experienced an unexpected error.",
];

/**
 * TODO: Remove once the API endpoint is available.
 */
const STUB_BATCH_REASSESSMENT_APPLICATIONS: BatchReassessmentApplicationAPIOutDTO[] =
  Array.from({ length: 27 }, (_, index) => {
    const applicationNumber = `${2600000000 + index * 7}`;
    if (index % 3 === 1) {
      const failureReason =
        STUB_FAILURE_REASONS[
          Math.floor(index / 3) % STUB_FAILURE_REASONS.length
        ];
      const exists = failureReason !== STUB_FAILURE_REASONS[3];
      return {
        applicationNumber,
        result: BatchReassessmentApplicationResult.Failed,
        failureReason,
      };
    }
    return {
      applicationNumber,
      applicationId: index + 1,
      studentId: 1,
      result:
        index % 3 === 0
          ? BatchReassessmentApplicationResult.Successful
          : BatchReassessmentApplicationResult.Pending,
    };
  });
