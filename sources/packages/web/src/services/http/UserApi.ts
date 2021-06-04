import { BCeIDDetailsDto, BCeIDAccountsDto } from "../../types/contracts/UserContract";
import HttpBaseClient from "./common/HttpBaseClient";

export class UserApi extends HttpBaseClient {
  public async checkUser(headers?: any): Promise<string> {
    try {
      const response = await this.apiClient.get(
        "users/check-user",
        headers || this.addAuthHeader(),
      );
      return response.data as string;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async bceidAccount(headers?: any): Promise<BCeIDDetailsDto | null> {
    try {
      const response = await this.apiClient.get(
        "users/bceid-account",
        headers || this.addAuthHeader(),
      );
      return response.data as BCeIDDetailsDto;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async bceidAccounts(headers?: any): Promise<BCeIDAccountsDto | null> {
    try {
      const response = await this.apiClient.get(
        "users/bceid-accounts",
        headers || this.addAuthHeader(),
      );
      return response.data as BCeIDAccountsDto;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

}
