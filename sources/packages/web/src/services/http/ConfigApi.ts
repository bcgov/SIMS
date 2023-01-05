import HttpBaseClient from "./common/HttpBaseClient";
import { ConfigAPIOutDTO } from "@/services/http/dto";

export class ConfigApi extends HttpBaseClient {
  public async getConfig(): Promise<ConfigAPIOutDTO> {
    try {
      const response = await this.apiClient.get("config");
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
