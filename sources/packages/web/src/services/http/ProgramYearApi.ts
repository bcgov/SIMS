import HttpBaseClient from "./common/HttpBaseClient";
import { OptionItemAPIOutDTO } from "@/services/http/dto";

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
}
