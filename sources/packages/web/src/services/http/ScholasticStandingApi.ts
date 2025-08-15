import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  ReverseScholasticStandingAPIInDTO,
  ScholasticStandingDataAPIInDTO,
  ScholasticStandingSubmittedDetailsAPIOutDTO,
  ScholasticStandingSummaryDetailsAPIOutDTO,
} from "@/services/http/dto";
import { AxiosProgressEvent, AxiosRequestConfig } from "axios";
import ApiClient from "./ApiClient";

/**
 * Http API client for Scholastic standing.
 */
export class ScholasticStandingApi extends HttpBaseClient {
  /**
   * Get Scholastic Standing submitted details.
   * @param scholasticStandingId scholastic standing id.
   * @returns Scholastic Standing.
   */
  async getScholasticStanding(
    scholasticStandingId: number,
  ): Promise<ScholasticStandingSubmittedDetailsAPIOutDTO> {
    return this.getCall<ScholasticStandingSubmittedDetailsAPIOutDTO>(
      this.addClientRoot(`scholastic-standing/${scholasticStandingId}`),
    );
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
    let url = "scholastic-standing/summary";
    if (options?.studentId) {
      url += `/student/${options?.studentId}`;
    }
    return this.getCall<ScholasticStandingSummaryDetailsAPIOutDTO>(
      this.addClientRoot(url),
    );
  }

  /**
   * Save scholastic standing and create new assessment.
   * @param applicationId application id.
   * @param locationId location id.
   * @param payload scholasticStanding payload.
   */
  public async saveScholasticStanding(
    applicationId: number,
    locationId: number,
    payload: ScholasticStandingDataAPIInDTO,
  ): Promise<void> {
    await this.postCall(
      this.addClientRoot(
        `scholastic-standing/location/${locationId}/application/${applicationId}`,
      ),
      { data: payload },
    );
  }

  /**
   * Process a text with applications to be withdrawn.
   * @param file file content with all information needed to withdraw applications.
   * @param validationOnly if true, will execute all validations and return the
   * errors and warnings. These validations are the same executed during the
   * final creation process. If false, the file will be processed and the records
   * will be inserted.
   **Validations errors are returned using different HTTP status codes.
   * @onUploadProgress event to report the upload progress.
   */
  async applicationBulkWithdrawal(
    file: Blob,
    validationOnly: boolean,
    onUploadProgress: (progressEvent: AxiosProgressEvent) => void,
  ): Promise<void> {
    const formData = new FormData();
    formData.append("file", file);
    // Configure the request to provide upload progress status.
    const requestConfig: AxiosRequestConfig = { onUploadProgress };
    await ApiClient.FileUpload.upload(
      `scholastic-standing/application-bulk-withdrawal?validation-only=${validationOnly}`,
      formData,
      requestConfig,
    );
  }

  /**
   * Reverse a scholastic standing and create a note for the reversal.
   * Based on the scholastic standing type, there will be additional steps as part of the reversal process.
   * For all the scholastic standing types which creates re-assessment, a new re-assessment will be created
   * during the reversal process to reverse the study period changes.
   * For all the scholastic standing types which archives the application, the archiving will be reversed.
   * @param scholasticStandingId scholastic standing id to reverse.
   * @param payload payload for the scholastic standing reversal.
   */
  async reverseScholasticStanding(
    scholasticStandingId: number,
    payload: ReverseScholasticStandingAPIInDTO,
  ): Promise<void> {
    await this.patchCall(
      this.addClientRoot(`scholastic-standing/${scholasticStandingId}/reverse`),
      { data: payload },
    );
  }
}
