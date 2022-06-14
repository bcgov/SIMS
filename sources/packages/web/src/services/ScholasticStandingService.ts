import ApiClient from "@/services/http/ApiClient";
import {
  ScholasticStandingDataAPIInDTO,
  ScholasticStandingSubmittedDetailsAPIOutDTO,
} from "./http/dto";

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
    return ApiClient.ScholasticStandingApi.getScholasticStanding(
      scholasticStandingId,
    );
  }

  /**
   * Save scholastic standing and create new assessment.
   * @param applicationId application id
   * @param locationId location id
   * @param payload scholasticStanding payload
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
}
