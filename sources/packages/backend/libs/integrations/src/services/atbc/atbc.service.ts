import { Injectable } from "@nestjs/common";
import { ATBCIntegrationConfig, ConfigService } from "@sims/utilities/config";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import { ATBCHeader, ATBCAuthTokenResponse } from "./models/atbc-auth.model";
import {
  ATBCCreateClientResponse,
  ATBCCreateClientPayload,
  ATBCDisabilityStatusResponse,
  ATBC_DATE_FORMAT,
} from "./models/atbc.model";
import { HttpService } from "@nestjs/axios";
import { formatDate } from "@sims/utilities";

@Injectable()
export class ATBCService {
  private readonly atbcIntegrationConfig: ATBCIntegrationConfig;
  constructor(
    configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.atbcIntegrationConfig = configService.atbcIntegration;
  }
  /**
   * Executes the token request
   * @returns bearer header.
   */
  private async getATBCEndpointConfig(): Promise<ATBCHeader> {
    const loginResponse = await this.loginToATBC();
    const accessToken = loginResponse.accessToken;
    return {
      headers: { Authorization: `Bearer ${accessToken}` },
      // (NOTE: this will disable client verification)
      // TODO: add certificate for PROD
      httpsAgent: new (require("https").Agent)({
        rejectUnauthorized: true,
      }),
    };
  }

  /**
   * Check for student disability status updates.
   * @param date disability retrieval date.
   * @returns student disability status updates.
   */
  async getStudentDisabilityStatusUpdatesByDate(
    date?: Date,
  ): Promise<ATBCDisabilityStatusResponse[]> {
    const processingDate = date ?? new Date();
    const processingDateString = formatDate(processingDate, ATBC_DATE_FORMAT);
    try {
      this.logger.log("Checking for student disability status updates.");
      const headers = await this.getATBCEndpointConfig();
      const apiEndpoint = `${this.atbcIntegrationConfig.ATBCEndpoint}/sfas?sfasDate=${processingDateString}`;
      const studentPDUpdateResponse = await this.httpService.axiosRef.get<
        ATBCDisabilityStatusResponse[]
      >(apiEndpoint, headers);
      return studentPDUpdateResponse.data;
    } catch (error: unknown) {
      this.logger.error(
        "Unexpected error occurred while checking for student disability status updates.",
      );
      this.logger.error(error);
      throw error;
    }
  }

  /**
   * Executes the authentication on ATBC.
   * @returns the result of a success full authentication or throws an exception
   * in case the result is anything different from HTTP 200 code.
   */
  private async loginToATBC(): Promise<ATBCAuthTokenResponse> {
    try {
      const agent = new (require("https").Agent)({
        rejectUnauthorized: process.env.NODE_ENV !== "production",
      });

      const authRequest = await this.httpService.axiosRef.post(
        this.atbcIntegrationConfig.ATBCLoginEndpoint,
        {
          usr: this.atbcIntegrationConfig.ATBCUserName,
          pwd: this.atbcIntegrationConfig.ATBCPassword,
          app: this.atbcIntegrationConfig.ATBCApp,
        },
        { httpsAgent: agent },
      );
      return authRequest?.data as ATBCAuthTokenResponse;
    } catch (excp) {
      this.logger.error(`Received exception while ATBC Authentication`);
      this.logger.error(`${JSON.stringify(excp.response)} `);
      throw excp;
    }
  }

  /**
   * Create client on ATBC.
   * @returns the result of a success full authentication or throws an exception
   * in case the result is anything different from HTTP 200 code.
   */
  async createClient(
    payload: ATBCCreateClientPayload,
  ): Promise<ATBCCreateClientResponse> {
    try {
      const config = await this.getATBCEndpointConfig();
      const apiEndpoint = `${this.atbcIntegrationConfig.ATBCEndpoint}/pd-clients`;
      const res = await this.httpService.axiosRef.post(
        apiEndpoint,
        payload,
        config,
      );
      return res?.data as ATBCCreateClientResponse;
    } catch (excp) {
      this.logger.error(`Received exception while creating client at ATBC`);
      this.logger.error(excp);
      throw excp;
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
