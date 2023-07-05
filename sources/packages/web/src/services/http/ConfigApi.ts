import HttpBaseClient from "./common/HttpBaseClient";
import { ConfigAPIOutDTO } from "@/services/http/dto";

export class ConfigApi extends HttpBaseClient {
  async getConfig(): Promise<ConfigAPIOutDTO> {
    return this.getCall<ConfigAPIOutDTO>("config", undefined, true);
  }

  /**
   * Gets the current API version.
   * @returns current API version.
   */
  async getAPIVersion(): Promise<string> {
    return this.getCall<string>("config/version", undefined, true);
  }
}
