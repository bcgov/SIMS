import HttpBaseClient from "./common/HttpBaseClient";
import { OptionItemDto, ProgramYear } from "../../types";

export class ProgramYearApi extends HttpBaseClient {
  public async getProgramYears(): Promise<OptionItemDto[]> {
    const response = await this.apiClient.get(
      "program-year/options-list",
      this.addAuthHeader(),
    );
    return response.data;
  }
  public async getActiveProgramYear(
    programYearId: number,
  ): Promise<ProgramYear> {
    const response = await this.apiClient.get(
      `program-year/${programYearId}`,
      this.addAuthHeader(),
    );
    return response.data;
  }
}
