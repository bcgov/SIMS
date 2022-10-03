import { Injectable } from "@nestjs/common";
import axios from "axios";
import { AccountDetails } from "./account-details.model";
import {
  SearchAccountOptions,
  SearchBCeIDAccountResult,
} from "./search-bceid.model";
import getAccountDetailsMock from "./mockups/getAccountDetails.mock";
import searchBCeIDAccountsMock from "./mockups/searchBCeIDAccounts.mock";
import { KeycloakService } from "../auth/keycloak/keycloak.service";

// This service is intended to return only fake data for development purposes only.
// It allows the simulation of the response from BCeID Web Service.
// This service will be used when the below env variable is set
// DUMMY_BCeID_ACCOUNT_RESPONSE === "yes"
// IMPORTANT: This class will not be part of the production runtime code
// because only the BCeIDService is added to the application (app.module.ts).
// This is achieved through the use of the BCeIDServiceProvider.
@Injectable()
export class BCeIDServiceMock {
  private async getDevResponse(path: string) {
    if (
      !process.env.E2E_TEST_INSTITUTION_USERNAME ||
      !process.env.E2E_TEST_INSTITUTION_PASSWORD
    ) {
      return null;
    }
    const baseURL = "https://dev-aest-sims.apps.silver.devops.gov.bc.ca/api";
    try {
      const token = await KeycloakService.shared.getToken(
        process.env.E2E_TEST_INSTITUTION_USERNAME,
        process.env.E2E_TEST_INSTITUTION_PASSWORD,
        "institution",
      );

      if (token) {
        const resp = await axios.get(`${baseURL}${path}`, {
          headers: { Authorization: `Bearer ${token.access_token}` },
        });

        return resp.data;
      }
      return null;
    } catch (excp) {
      return null;
    }
  }
  public async getAccountDetails(userName: string): Promise<AccountDetails> {
    const respData = await this.getDevResponse("/users/bceid-account");
    if (respData) {
      return respData as AccountDetails;
    }

    return getAccountDetailsMock;
  }

  public async searchBCeIDAccounts(
    options: SearchAccountOptions,
  ): Promise<SearchBCeIDAccountResult> {
    const respData = await this.getDevResponse("/users/bceid-accounts");
    if (respData) {
      return respData as SearchBCeIDAccountResult;
    }
    return searchBCeIDAccountsMock;
  }
}
