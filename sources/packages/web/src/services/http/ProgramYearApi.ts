import { ProgramYearsApiOutDTO } from "@/services/http/dto/ProgramYear.dto";
import HttpBaseClient from "./common/HttpBaseClient";
import { OptionItemAPIOutDTO } from "@/services/http/dto";

export class ProgramYearApi extends HttpBaseClient {
  /**
   * Gets a list of program years returned as option items (id/description pair).
   * @returns an array of program years as OptionItemAPIOutDTO.
   */
  async getProgramYearsOptionsList(): Promise<OptionItemAPIOutDTO[]> {
    return this.getCall(this.addClientRoot("program-year/options-list"));
  }

  /**
   * Gets a list of program years.
   * @returns list of program years.
   */
  async getProgramYears(): Promise<ProgramYearsApiOutDTO> {
    return this.getCall(this.addClientRoot("program-year"));
  }
}
