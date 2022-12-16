import ApiClient from "@/services/http/ApiClient";
import { OptionItemAPIOutDTO, ProgramYearAPIOutDTO } from "@/services/http/dto";

export class ProgramYearService {
  // Share Instance
  private static instance: ProgramYearService;

  static get shared(): ProgramYearService {
    return this.instance || (this.instance = new this());
  }
  async getProgramYearOptions(): Promise<OptionItemAPIOutDTO[]> {
    return ApiClient.ProgramYear.getProgramYears();
  }
  async getActiveProgramYear(
    programYearId: number,
  ): Promise<ProgramYearAPIOutDTO> {
    return ApiClient.ProgramYear.getActiveProgramYearById(programYearId);
  }
}
