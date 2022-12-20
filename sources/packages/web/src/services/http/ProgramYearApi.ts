import HttpBaseClient from "./common/HttpBaseClient";
import { OptionItemAPIOutDTO, ProgramYearAPIOutDTO } from "@/services/http/dto";

export class ProgramYearApi extends HttpBaseClient {
  /**
   * Gets a list of program years returned as option items (id/description pair).
   * @returns an array of program years as OptionItemAPIOutDTO.
   */
  async getProgramYears(): Promise<OptionItemAPIOutDTO[]> {
    return this.getCallTyped<OptionItemAPIOutDTO[]>(
      this.addClientRoot("program-year/options-list"),
    );
  }

  /**
   * Gets an active program year given an id.
   * @param id program year id.
   * @returns an active program year with the id provided.
   */
  async getActiveProgramYearById(
    programYearId: number,
  ): Promise<ProgramYearAPIOutDTO> {
    return this.getCallTyped<ProgramYearAPIOutDTO>(
      this.addClientRoot(`program-year/${programYearId}/active`),
    );
  }
}
