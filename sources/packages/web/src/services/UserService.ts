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

  async getBCeIDAccountDetails(): Promise<BCeIDDetailsDto> {
    return await ApiClient.User.bceidAccount();
  }
}
