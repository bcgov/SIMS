import HttpBaseClient from "./common/HttpBaseClient";
import { PaginatedResults, ClientIdType, PaginationOptions } from "@/types";
import {
  InstitutionUserAPIOutDTO,
  InstitutionUserDetailAPIOutDTO,
  InstitutionUserStatusAPIOutDTO,
  CreateInstitutionUserAPIInDTO,
  UpdateInstitutionUserAPIInDTO,
  UserActiveStatusAPIInDTO,
} from "@/services/http/dto";
import { AuthService } from "../AuthService";
import { getPaginationQueryString } from "@/helpers";

export class InstitutionUserApi extends HttpBaseClient {
  /**
   * Get details of user who is logged in.
   * @returns user details.
   */
  async getMyInstitutionDetails(
    header?: any,
  ): Promise<InstitutionUserDetailAPIOutDTO> {
    return this.getCallTyped<InstitutionUserDetailAPIOutDTO>(
      this.addClientRoot("institution-user/my-details"),
      header,
    );
  }

  /**
   * Get institution user summary.
   * @param paginationOptions pagination options.
   * @param institutionId institution to be searched. If not
   * provided the institution id will be retrieved from the token,
   * when available.
   * @returns all filtered institution users.
   */
  async searchUsers(
    paginationOptions: PaginationOptions,
    institutionId?: number,
  ): Promise<PaginatedResults<InstitutionUserAPIOutDTO>> {
    let url = "institution-user?";
    if (AuthService.shared.authClientType === ClientIdType.AEST) {
      url += `institutionId=${institutionId}&`;
    }
    url += getPaginationQueryString(paginationOptions);
    return this.getCallTyped<PaginatedResults<InstitutionUserAPIOutDTO>>(
      this.addClientRoot(url),
    );
  }

  /**
   * Create a user, associate with the institution, and assign the authorizations.
   * @param payload authorizations to be associated with the user.
   * @param institutionId institution to have the user associated. If not provided the
   * token information will be used, if available.
   * @returns Primary identifier of the created resource.
   */
  async createInstitutionUserWithAuth(
    payload: CreateInstitutionUserAPIInDTO,
    institutionId?: number,
  ): Promise<void> {
    let url = "institution-user";
    if (AuthService.shared.authClientType === ClientIdType.AEST) {
      url = `institution-user/${institutionId}`;
    }
    try {
      await this.postCall<CreateInstitutionUserAPIInDTO>(
        this.addClientRoot(url),
        payload,
      );
    } catch (error: unknown) {
      this.handleAPICustomError(error);
    }
  }

  /**
   * Update the user authorizations for the institution user.
   * @param userName user to have the permissions updated.
   * @param payload permissions to be updated.
   */
  async updateInstitutionUserWithAuth(
    userName: string,
    payload: UpdateInstitutionUserAPIInDTO,
  ): Promise<void> {
    try {
      return await this.patchCall<UpdateInstitutionUserAPIInDTO>(
        this.addClientRoot(`institution-user/${userName}`),
        payload,
      );
    } catch (error: unknown) {
      this.handleAPICustomError(error);
    }
  }

  /**
   * Get the user status from institution perspective returning the
   * possible user and institution association.
   * @returns information to support the institution login process and
   * the decisions that need happen to complete the process.
   */
  async getInstitutionUserStatus(): Promise<InstitutionUserStatusAPIOutDTO> {
    return this.getCallTyped<InstitutionUserStatusAPIOutDTO>(
      this.addClientRoot("institution-user/status"),
    );
  }

  /**
   * Get institution user by user name(guid).
   * @param userName user name (guid).
   * @returns institution user details.
   */
  async getInstitutionUserByUserName(
    userName: string,
  ): Promise<InstitutionUserAPIOutDTO> {
    return this.getCallTyped<InstitutionUserAPIOutDTO>(
      this.addClientRoot(`institution-user/${userName}`),
    );
  }

  /**
   * Update the active status of the user.
   * @param userName unique name of the user to be updated.
   * @param isActive enable or disable the user.
   */
  public async updateUserStatus(
    userName: string,
    isActive: boolean,
  ): Promise<void> {
    try {
      await this.patchCall<UserActiveStatusAPIInDTO>(
        this.addClientRoot(`institution-user/${userName}/status`),
        {
          isActive,
        },
      );
    } catch (error: unknown) {
      this.handleAPICustomError(error);
    }
  }
}
