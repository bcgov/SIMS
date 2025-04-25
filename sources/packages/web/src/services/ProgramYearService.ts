import ApiClient from "@/services/http/ApiClient";
import {
  OptionItemAPIOutDTO,
  ProgramYearAndFormDetailsAPIOutDTO,
} from "@/services/http/dto";
import { OfferingIntensity } from "@/types";

export class ProgramYearService {
  // Share Instance
  private static instance: ProgramYearService;

  static get shared(): ProgramYearService {
    return this.instance || (this.instance = new this());
  }

  async getProgramYearOptions(): Promise<OptionItemAPIOutDTO[]> {
    return ApiClient.ProgramYear.getProgramYears();
  }

  /**
   * Get program year and form name for an active program year.
   * @param id program year id.
   * @param offeringIntensity application offering intensity.
   * @returns an active program year with the id provided.
   */
  async getProgramYearAndFormDetails(
    programYearId: number,
    offeringIntensity: OfferingIntensity,
  ): Promise<ProgramYearAndFormDetailsAPIOutDTO> {
    return ApiClient.ProgramYear.getProgramYearAndFormDetails(
      programYearId,
      offeringIntensity,
    );
  }
}
