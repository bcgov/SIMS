import { Injectable } from "@nestjs/common";
import { BasicAuthSecurity, Client, createClientAsync } from "soap";
import { InjectLogger } from "../../common";
import { BCeIDConfig } from "../../types/config";
import { LoggerService } from "../../logger/logger.service";
import { ConfigService } from "../config/config.service";
import { AccountDetails } from "./account-details.model";

@Injectable()
export class BCeIDService {
  private bceidConfig: BCeIDConfig;
  constructor(private readonly config: ConfigService) {
    this.bceidConfig = this.config.getConfig().bceid;
  }

  public async getAccountDetails(userId: string): Promise<AccountDetails> {
    var client = await this.getSoapClient();

    var body = {
      accountDetailRequest: {
        onlineServiceId: this.bceidConfig.onlineServiceId,
        requesterAccountTypeCode: "Internal",
        requesterUserGuid: this.bceidConfig.requesterUserGuid,
        userId: userId,
        accountTypeCode: "Business",
      },
    };

    try {
      const [result] = await client.getAccountDetailAsync(body);
      if (!result.getAccountDetailResult) {
        throw new Error(
          "Unexpected result from getAccountDetail method from BCeID Web Service.",
        );
      }

      const userAccount = result.getAccountDetailResult.account;
      if (result.getAccountDetailResult) {
        return {
          user: {
            guid: userAccount.guid.value,
            displayName: userAccount.displayName.value,
            firstname: userAccount.individualIdentity?.name?.firstname.value,
            surname: userAccount.individualIdentity?.name?.surname.value,
            email: userAccount.contact?.email.value,
          },
          institution: {
            guid: userAccount.business?.guid.value,
            legalName: userAccount.business?.legalName.value,
          },
        };
      }
    } catch (error) {
      this.logger.error(
        "Error while retrieving account details from BCeID Web Service.",
      );
      this.logger.error(error);
      throw error;
    }
  }

  private async getSoapClient(): Promise<Client> {
    const clientSecurity = new BasicAuthSecurity(
      this.bceidConfig.credential.userName,
      this.bceidConfig.credential.password,
    );

    try {
      var client = await createClientAsync(this.bceidConfig.wsdlEndpoint, {
        wsdl_headers: this.getWsdlAuthHeader(),
      });
      client.setSecurity(clientSecurity);
      return client;
    } catch (error) {
      this.logger.error("Error while creating BCeID Web Service client.");
      this.logger.error(error);
      throw error;
    }
  }

  private getWsdlAuthHeader() {
    const auth =
      "Basic " +
      Buffer.from(
        `${this.bceidConfig.credential.userName}:${this.bceidConfig.credential.password}`,
      ).toString("base64");
    return { Authorization: auth };
  }

  @InjectLogger()
  logger: LoggerService;
}
