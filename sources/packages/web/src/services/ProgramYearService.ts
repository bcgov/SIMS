import ApiClient from "./http/ApiClient";
import { ProgramYear } from "../types/contracts/ProgramYearContract";

export class ProgramYearService {
  // Share Instance
  private static instance: ProgramYearService;

  public static get shared(): ProgramYearService {
    return this.instance || (this.instance = new this());
  }
  async getProgramYears(): Promise<ProgramYear[]> {
    return ApiClient.ProgramYear.getProgramYears();
  }
}
