import { ProgramYearApiOutDTO } from "@/services/http/dto/ProgramYear.dto";
import HttpBaseClient from "./common/HttpBaseClient";

export class ProgramYearApi extends HttpBaseClient {
  /**
   * Gets a list of program years.
   * @returns list of program years.
   */
  async getProgramYears(): Promise<ProgramYearApiOutDTO[]> {
    return this.getCall(this.addClientRoot("program-year"));
  }
}
