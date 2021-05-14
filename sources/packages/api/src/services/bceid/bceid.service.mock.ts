import { Injectable } from "@nestjs/common";
import { AccountDetails } from "./account-details.model";
import {
  SearchAccountOptions,
  SearchBCeIDAccountResult,
} from "./search-bceid.model";
import getAccountDetailsMock from "./mockups/getAccountDetails.mock";
import searchBCeIDAccountsMock from "./mockups/searchBCeIDAccounts.mock";

// This service is intended to return only fake data for development purposes only.
// It allows the simulation of the response from BCeID Web Service.
// This service will be used when the below env variable is set
// DUMMY_BCeID_ACCOUNT_RESPONSE === "yes"
// IMPORTANT: This class will not be part of the production runtime code
// because only the BCeIDService is added to the application (app.module.ts).
// This is achieved through the use of the BCeIDServiceProvider.
@Injectable()
export class BCeIDServiceMock {
  public async getAccountDetails(userName: string): Promise<AccountDetails> {
    return getAccountDetailsMock;
  }

  public async searchBCeIDAccounts(
    options: SearchAccountOptions,
  ): Promise<SearchBCeIDAccountResult> {
    return searchBCeIDAccountsMock;
  }
}
