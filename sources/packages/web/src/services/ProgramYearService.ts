import ApiClient from "@/services/http/ApiClient";
import { OptionItemAPIOutDTO } from "@/services/http/dto";
import { ProgramYearsApiOutDTO } from "@/services/http/dto/ProgramYear.dto";

export class ProgramYearService {
  // Share Instance
  private static instance: ProgramYearService;

  static get shared(): ProgramYearService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Gets a list of program years returned as option items (id/description pair).
   * @returns an array of program years as OptionItemAPIOutDTO.
   */
  async getProgramYearsOptionsList(): Promise<OptionItemAPIOutDTO[]> {
    return ApiClient.ProgramYear.getProgramYearsOptionsList();
  }

  /**
   * Gets a list of program years.
   * @returns list of program years.
   */
  async getProgramYears(): Promise<ProgramYearsApiOutDTO> {
    return ApiClient.ProgramYear.getProgramYears();
  }
}
