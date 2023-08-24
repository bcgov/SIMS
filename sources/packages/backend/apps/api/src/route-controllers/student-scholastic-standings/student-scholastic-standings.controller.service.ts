import { Injectable, NotFoundException } from "@nestjs/common";
import { StudentScholasticStandingsService } from "../../services";
import { ScholasticStandingSubmittedDetailsAPIOutDTO } from "./models/student-scholastic-standings.dto";
import { transformToActiveApplicationDataAPIOutDTO } from "../institution-locations/models/application.dto";

/**
 * Scholastic standing controller service.
 */
@Injectable()
export class ScholasticStandingControllerService {
  constructor(
    private readonly studentScholasticStandingsService: StudentScholasticStandingsService,
  ) {}

  /**
   * Get Scholastic Standing submitted details.
   * @param scholasticStandingId scholastic standing id.
   * @param locationIds array of institution location ids.
   * @returns Scholastic Standing.
   */
  async getScholasticStanding(
    scholasticStandingId: number,
    locationIds?: number[],
  ): Promise<ScholasticStandingSubmittedDetailsAPIOutDTO> {
    const scholasticStanding =
      await this.studentScholasticStandingsService.getScholasticStanding(
        scholasticStandingId,
        locationIds,
      );

    if (!scholasticStanding) {
      throw new NotFoundException("Scholastic Standing not found.");
    }

    const application = scholasticStanding.application;
    const offering = scholasticStanding.referenceOffering;

    return {
      ...scholasticStanding.submittedData,
      ...transformToActiveApplicationDataAPIOutDTO(application, offering),
    };
  }
}
