import {
  BCeIDDetailsAPIOutDTO,
  BCeIDAccountsAPIOutDTO,
  InstitutionUserDetailsAPIOutDTO,
  InstitutionUserPersistAPIInDTO,
} from "@/services/http/dto";
import HttpBaseClient from "./common/HttpBaseClient";
import {
  MISSING_GROUP_ACCESS,
  MISSING_USER_ACCOUNT,
  MISSING_USER_INFO,
} from "@/constants";
import { ApiProcessError } from "@/types";

export class UserApi extends HttpBaseClient {
  async bceidAccount(): Promise<BCeIDDetailsAPIOutDTO> {
    return this.getCall<BCeIDDetailsAPIOutDTO>(
      this.addClientRoot("user/bceid-account"),
    );
  }

  async bceidAccounts(): Promise<BCeIDAccountsAPIOutDTO | null> {
    return this.getCall<BCeIDAccountsAPIOutDTO>(
      this.addClientRoot("user/bceid-accounts"),
    );
  }

  async getInstitutionUser(): Promise<InstitutionUserDetailsAPIOutDTO> {
    return this.getCall<InstitutionUserDetailsAPIOutDTO>(
      this.addClientRoot("user"),
    );
  }

  async updateInstitutionUser(
    data: InstitutionUserPersistAPIInDTO,
  ): Promise<void> {
    return this.patchCall<InstitutionUserPersistAPIInDTO>(
      this.addClientRoot("user"),
      data,
    );
  }

  /**
   * Tries to create/update the AEST user.
   * @returns true if the user was successfully created/updated or
   * false if the user do not have permission to access the system.
   */
  async syncAESTUser(): Promise<boolean> {
    try {
      await this.putCall(this.addClientRoot("user"), null);
      return true;
    } catch (error: unknown) {
      if (
        error instanceof ApiProcessError &&
        (error.errorType === MISSING_USER_ACCOUNT ||
          error.errorType === MISSING_GROUP_ACCESS ||
          error.errorType === MISSING_USER_INFO)
      ) {
        // If the user do not have a proper authorization
        // an HTTP error will be raised.
        return false;
      }
      throw error;
    }
  }

  /**
   * Allows a token creation to provide access to the queues admin
   * for an already authorized users with a role that allow the access.
   */
  async queueAdminTokenExchange(): Promise<void> {
    await this.postCallFullResponse(
      this.addClientRoot("user/queue-admin-token-exchange"),
      null,
      { withCredentials: true },
    );
  }
}
