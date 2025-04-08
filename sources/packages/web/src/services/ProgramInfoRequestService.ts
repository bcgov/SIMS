import ApiClient from "./http/ApiClient";
import {
  CompleteProgramInfoRequestAPIInDTO,
  DenyProgramInfoRequestAPIInDTO,
  PIRDeniedReasonAPIOutDTO,
  PIRSummaryAPIOutDTO,
  ProgramInfoRequestAPIOutDTO,
  PIRSearchCriteria,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";

export class ProgramInfoRequestService {
  // Shared Instance
  private static instance: ProgramInfoRequestService;

  static get shared(): ProgramInfoRequestService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Gets the information to show a Program Information Request (PIR)
   * with the data provided by the student, either when student select
   * an existing program or not.
   * @param locationId location id.
   * @param applicationId application id.
   * @returns program information request.
   */
  async getProgramInfoRequest(
    locationId: number,
    applicationId: number,
  ): Promise<ProgramInfoRequestAPIOutDTO> {
    return ApiClient.ProgramInfoRequest.getProgramInfoRequest(
      locationId,
      applicationId,
    );
  }

  /**
   * Completes the Program Info Request (PIR), defining the
   * PIR status as completed in the student application table.
   * The PIR is completed by select an existing offering.
   * @param locationId location that is completing the PIR.
   * @param applicationId application id to be updated.
   * @param payload offering to be updated in the student application.
   */
  async completeProgramInfoRequest(
    locationId: number,
    applicationId: number,
    payload: CompleteProgramInfoRequestAPIInDTO,
  ): Promise<void> {
    await ApiClient.ProgramInfoRequest.completeProgramInfoRequest(
      locationId,
      applicationId,
      payload,
    );
  }

  /**
   * Deny the Program Info Request (PIR), defining the
   * PIR status as Declined in the student application table.
   * @param locationId location that is completing the PIR.
   * @param applicationId application id to be updated.
   * @param payload contains the denied reason of the student application.
   */
  async denyProgramInfoRequest(
    locationId: number,
    applicationId: number,
    payload: DenyProgramInfoRequestAPIInDTO,
  ): Promise<void> {
    await ApiClient.ProgramInfoRequest.denyProgramInfoRequest(
      locationId,
      applicationId,
      payload,
    );
  }

  /**
   * Get all applications of a location in an institution
   * with Program Info Request (PIR) status completed and required.
   * @param locationId location that is completing the PIR.
   * @param searchCriteria search criteria for filtering and pagination.
   * @returns paginated student application list of an institution location.
   */
  async getPIRSummary(
    locationId: number,
    searchCriteria: PIRSearchCriteria,
  ): Promise<PaginatedResultsAPIOutDTO<PIRSummaryAPIOutDTO>> {
    return ApiClient.ProgramInfoRequest.getPIRSummary(
      locationId,
      searchCriteria,
    );
  }

  /**
   * Get all PIR denied reasons, which are active.
   * @returns PIR denied reason list.
   */
  async getPIRDeniedReasonList(): Promise<PIRDeniedReasonAPIOutDTO[]> {
    return ApiClient.ProgramInfoRequest.getPIRDeniedReasonList();
  }
}
