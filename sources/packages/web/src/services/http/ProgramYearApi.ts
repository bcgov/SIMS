import { OfferingIntensity } from "@/types";
import HttpBaseClient from "./common/HttpBaseClient";
import {
  OptionItemAPIOutDTO,
  ProgramYearAndFormDetailsAPIOutDTO,
} from "@/services/http/dto";

export class ProgramYearApi extends HttpBaseClient {
  /**
   * Gets a list of program years returned as option items (id/description pair).
   * @returns an array of program years as OptionItemAPIOutDTO.
   */
  async getProgramYears(): Promise<OptionItemAPIOutDTO[]> {
    return this.getCall<OptionItemAPIOutDTO[]>(
      this.addClientRoot("program-year/options-list"),
    );
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
    return this.getCall<ProgramYearAndFormDetailsAPIOutDTO>(
      this.addClientRoot(`program-year/${programYearId}/${offeringIntensity}`),
    );
  }
}
