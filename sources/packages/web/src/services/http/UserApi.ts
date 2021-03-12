import { BCeIDDetailsDto } from "../../types/contracts/UserContract";
import HttpBaseClient from "./common/HttpBaseClient";

export class UserApi extends HttpBaseClient {
  public async checkUser(): Promise<boolean> {
    try {
      const response = await this.apiClient.get(
        "users/check-user",
        this.addAuthHeader(),
      );
      return response.data as boolean;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async bceidAccount(): Promise<BCeIDDetailsDto> {
    try {
      const response = await this.apiClient.get(
        "users/bceid-account",
        this.addAuthHeader(),
      );
      return response.data as BCeIDDetailsDto;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
