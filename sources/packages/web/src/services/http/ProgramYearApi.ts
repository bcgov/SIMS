import HttpBaseClient from "./common/HttpBaseClient";
import { OptionItemAPIOutDTO, ProgramYearAPIOutDTO } from "@/services/http/dto";

export class ProgramYearApi extends HttpBaseClient {
  async getProgramYears(): Promise<OptionItemAPIOutDTO[]> {
    return this.getCallTyped("program-year/options-list");
  }

  async getActiveProgramYearById(
    programYearId: number,
  ): Promise<ProgramYearAPIOutDTO> {
    return this.getCallTyped(`program-year/${programYearId}/active`);
  }
}
