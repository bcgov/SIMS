import { useFormatters } from "@/composables";
import ApiClient from "@/services/http/ApiClient";
import {
  ScholasticStandingDataAPIInDTO,
  ScholasticStandingSubmittedDetailsAPIOutDTO,
} from "@/services/http/dto";

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
    locationId?: number,
  ): Promise<ScholasticStandingSubmittedDetailsAPIOutDTO> {
    const { dateOnlyLongString } = useFormatters();
    const applicationDetails =
      await ApiClient.ScholasticStandingApi.getScholasticStanding(
        scholasticStandingId,
        locationId,
      );

    return {
      ...applicationDetails,
      applicationOfferingStartDate: dateOnlyLongString(
        applicationDetails.applicationOfferingStartDate,
      ),
      applicationOfferingEndDate: dateOnlyLongString(
        applicationDetails.applicationOfferingEndDate,
      ),
      applicationOfferingStudyBreak:
        applicationDetails.applicationOfferingStudyBreak?.map((studyBreak) => ({
          breakStartDate: dateOnlyLongString(studyBreak.breakStartDate),
          breakEndDate: dateOnlyLongString(studyBreak.breakEndDate),
        })),
    };
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
}
