import HttpBaseClient from "./common/HttpBaseClient";
import { ConfigAPIOutDTO } from "@/services/http/dto";

export class ConfigApi extends HttpBaseClient {
  async getConfig(): Promise<ConfigAPIOutDTO> {
    try {
      const response = await this.getCall<ConfigAPIOutDTO>("config");
      return response;
    } catch (error: unknown) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
