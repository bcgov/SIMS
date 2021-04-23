import ApiClient from "./http/ApiClient";
import { BCeIDDetailsDto } from "../types/contracts/UserContract";

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
}
