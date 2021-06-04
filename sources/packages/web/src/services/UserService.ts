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

  async checkUser(): Promise<boolean> {
    return await ApiClient.User.checkUser();
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

  async getAllUserLocations(authHeader?: any): Promise<UserLocationDto[]> {
    return await ApiClient.User.allUserLocationsApi(authHeader);
  }
}
