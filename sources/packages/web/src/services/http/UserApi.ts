import { AxiosError } from "axios";
import {
  BCeIDDetailsAPIOutDTO,
  BCeIDAccountsAPIOutDTO,
  InstitutionUserAPIOutDTO,
  InstitutionUserPersistAPIInDTO,
} from "@/services/http/dto/User.dto";
import HttpBaseClient from "./common/HttpBaseClient";
import { StatusCodes } from "http-status-codes";

export class UserApi extends HttpBaseClient {
  async bceidAccount(): Promise<BCeIDDetailsAPIOutDTO> {
    return this.getCallTyped<BCeIDDetailsAPIOutDTO>(
      this.addClientRoot("users/bceid-account"),
    );
  }

  async bceidAccounts(): Promise<BCeIDAccountsAPIOutDTO | null> {
    return this.getCallTyped<BCeIDAccountsAPIOutDTO>(
      this.addClientRoot("users/bceid-accounts"),
    );
  }

  async getInstitutionUser(): Promise<InstitutionUserAPIOutDTO> {
    return this.getCallTyped<InstitutionUserAPIOutDTO>(
      this.addClientRoot("users"),
    );
  }

  async updateInstitutionUser(
    data: InstitutionUserPersistAPIInDTO,
  ): Promise<void> {
    return this.patchCall<InstitutionUserPersistAPIInDTO>(
      this.addClientRoot("users"),
      data,
    );
  }

  /**
   * Tries to create/update the AEST user.
   * @returns true if the user was successfully created/updated or
   * false if the user do not have permission to access the system.
   */
  async syncAESTUser(authHeader?: any): Promise<boolean> {
    try {
      await this.apiClient.put(
        this.addClientRoot("users"),
        // The data to perform the create/update
        // will come from the authentication token.
        null,
        authHeader ?? this.addAuthHeader(),
      );
      return true;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === StatusCodes.FORBIDDEN) {
        // If the user do not have a proper authorization
        // an HTTP error will be raised.
        return false;
      }
      // If it is not an expected error,
      // handle it the default way.
      this.handleRequestError(error);
      throw error;
    }
  }
}
