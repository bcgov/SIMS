import ApiClient from "./http/ApiClient";
import {
  BCeIDDetailsAPIOutDTO,
  BCeIDAccountsAPIOutDTO,
  InstitutionUserDetailsDto,
  InstitutionUserPersistAPIInDTO,
} from "../types/contracts/UserContract";

export class UserService {
  // Share Instance
  private static instance: UserService;

  public static get shared(): UserService {
    return this.instance || (this.instance = new this());
  }

  async getBCeIDAccountDetails(): Promise<BCeIDDetailsAPIOutDTO> {
    return ApiClient.User.bceidAccount();
  }

  async getBCeIDAccounts(): Promise<BCeIDAccountsAPIOutDTO | null> {
    try {
      return await ApiClient.User.bceidAccounts();
    } catch (excp) {
      return null;
    }
  }

  async getInstitutionUser(): Promise<InstitutionUserDetailsDto> {
    return ApiClient.User.getinstitutionUser();
  }

  async updateInstitutionUser(
    data: InstitutionUserPersistAPIInDTO,
  ): Promise<void> {
    return ApiClient.User.updateInstitutionUser(data);
  }

  /**
   * Tries to create/update the AEST user.
   * @returns true if the user was successfully created/updated or
   * false if the user do not have permission to access the system.
   */
  async syncAESTUser(authHeader?: any): Promise<boolean> {
    return ApiClient.User.syncAESTUser(authHeader);
  }
}
