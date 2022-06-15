import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  ScholasticStandingDataAPIInDTO,
  ScholasticStandingSubmittedDetailsAPIOutDTO,
} from "@/services/http/dto";

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
    return this.getCallTyped<ScholasticStandingSubmittedDetailsAPIOutDTO>(
      this.addClientRoot(`scholastic-standing/${scholasticStandingId}`),
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
    try {
      await this.postCall(
        this.addClientRoot(
          `scholastic-standing/location/${locationId}/application/${applicationId}`,
        ),
        { data: payload },
      );
    } catch (error: unknown) {
      this.handleAPICustomError(error);
    }
  }
}
