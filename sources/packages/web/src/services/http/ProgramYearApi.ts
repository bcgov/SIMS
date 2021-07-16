import HttpBaseClient from "./common/HttpBaseClient";
import { ProgramYear } from "../../types/contracts/ProgramYearContract";

export class ProgramYearApi extends HttpBaseClient {
  public async getProgramYears(): Promise<ProgramYear[]> {
    const response = await this.apiClient.get(
      "program-year",
      this.addAuthHeader(),
    );
    return response.data as ProgramYear[];
  }
}
