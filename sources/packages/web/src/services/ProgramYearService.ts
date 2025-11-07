import ApiClient from "@/services/http/ApiClient";
import { ProgramYearApiOutDTO } from "@/services/http/dto/ProgramYear.dto";

export class ProgramYearService {
  // Share Instance
  private static instance: ProgramYearService;

  static get shared(): ProgramYearService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Gets a list of program years.
   * @returns list of program years.
   */
  async getProgramYears(): Promise<ProgramYearApiOutDTO[]> {
    return ApiClient.ProgramYear.getProgramYears();
  }
}
