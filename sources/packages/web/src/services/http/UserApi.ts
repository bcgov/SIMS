import { AxiosError } from "axios";
import {
  BCeIDDetailsDto,
  BCeIDAccountsDto,
  InstitutionUserDetailsDto,
  InstitutionUserPersistDto,
} from "../../types/contracts/UserContract";
import HttpBaseClient from "./common/HttpBaseClient";
import { StatusCodes } from "http-status-codes";

export class UserApi extends HttpBaseClient {
  public async checkUser(headers?: any): Promise<boolean> {
    try {
      const response = await this.apiClient.get(
        "users/check-user",
        headers || this.addAuthHeader(),
      );
      return response.data as boolean;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async bceidAccount(headers?: any): Promise<BCeIDDetailsDto> {
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

  public async checkActiveUser(headers?: any): Promise<boolean> {
    try {
      const response = await this.apiClient.get(
        "users/check-active-user",
        headers || this.addAuthHeader(),
      );
      return response.data as boolean;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getinstitutionUser(): Promise<InstitutionUserDetailsDto> {
    try {
      const response = await this.apiClient.get(
        "users/institution",
        this.addAuthHeader(),
      );
      return response.data as InstitutionUserDetailsDto;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async updateInstitutionUser(
    data: InstitutionUserPersistDto,
  ): Promise<void> {
    try {
      await this.apiClient.patch(
        "users/institution",
        data,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  /**
   * Tries to create/update the AEST user.
   * @returns true if the user was successfully created/updated or
   * false if the user do not have permission to access the system.
   */
  public async syncAESTUser(authHeader?: any): Promise<boolean> {
    try {
      await this.apiClient.put(
        "users/aest",
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
