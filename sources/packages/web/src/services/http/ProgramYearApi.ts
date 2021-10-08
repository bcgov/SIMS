import HttpBaseClient from "./common/HttpBaseClient";
import { OptionItemDto } from "../../types";

export class ProgramYearApi extends HttpBaseClient {
  public async getProgramYears(): Promise<OptionItemDto[]> {
    const response = await this.apiClient.get(
      "program-year/options-list",
      this.addAuthHeader(),
    );
    return response.data;
  }
}
