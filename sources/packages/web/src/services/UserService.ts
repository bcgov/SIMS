import ApiClient from "./http/ApiClient";
import {
  BCeIDDetailsDto,
  BCeIDAccountsDto,
  UserLocationDto,
} from "../types/contracts/UserContract";

export class UserService {
  // Share Instance
  private static instance: UserService;

  public static get shared(): UserService {
    return this.instance || (this.instance = new this());
  }

  async checkUser(authHeader?: any): Promise<boolean> {
    return ApiClient.User.checkUser(authHeader);
  }

  async getBCeIDAccountDetails(
    authHeader?: any,
  ): Promise<BCeIDDetailsDto | null> {
    try {
      return await ApiClient.User.bceidAccount(authHeader);
    } catch (excp) {
      return null;
    }
  }

  async getBCeIDAccounts(authHeader?: any): Promise<BCeIDAccountsDto | null> {
    try {
      return await ApiClient.User.bceidAccounts(authHeader);
    } catch (excp) {
      return null;
    }
  }

  async getAllUserLocations(): Promise<UserLocationDto[]> {
    return ApiClient.User.allUserLocationsApi();
  }

  async checkActiveUser(authHeader?: any): Promise<boolean> {
    return ApiClient.User.checkActiveUser(authHeader);
  }
}
