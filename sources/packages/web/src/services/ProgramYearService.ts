import ApiClient from "./http/ApiClient";
import { OptionItemDto, ProgramYear } from "../types";

export class ProgramYearService {
  // Share Instance
  private static instance: ProgramYearService;

  public static get shared(): ProgramYearService {
    return this.instance || (this.instance = new this());
  }
  async getProgramYearOptions(): Promise<OptionItemDto[]> {
    return ApiClient.ProgramYear.getProgramYears();
  }
  async getActiveProgramYear(programYearId: number): Promise<ProgramYear> {
    return ApiClient.ProgramYear.getActiveProgramYear(programYearId);
  }
}
