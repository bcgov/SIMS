import { Injectable } from "@nestjs/common";
import { ConfigService } from "../config/config.service";
import axios from "axios";
import { LoggerService } from "../../logger/logger.service";
import { InjectLogger } from "../../common";
import {
  ATBCHeader,
  ATBCAuthTokenResponse,
} from "../auth/token-cache.service.models";
import {
  ATBCIntegrationConfig,
  ATBCCreateClientResponse,
  ATBCCreateClientPayload,
  ATBCPDCheckerResponse,
  ATBCPDCheckerPayload,
} from "../../types";

@Injectable()
export class ATBCService {
  constructor(private readonly configService: ConfigService) {
    this.logger.log("[Created]");
  }

  get config(): ATBCIntegrationConfig {
    return this.configService.getConfig().ATBCIntegration;
  }
  /**
   * Executes the token request
   * @returns bearer header.
   */
  private async getConfig(): Promise<ATBCHeader> {
    const token = await this.getAuthToken();
    return {
      headers: { Authorization: `Bearer ${token}` },
      // (NOTE: this will disable client verification)
      // TODO: add certificate for PROD
      httpsAgent: new (require("https").Agent)({
        rejectUnauthorized: false,
      }),
    };
  }

  /**
   * Gets the authentication token value to authorize the ATBC Endpoints.
   * @returns the token that is needed to bearer authentication.
   */
  private async getAuthToken(): Promise<string> {
    const authResponse = await this.ATBCLogin();
    return authResponse?.accessToken;
  }

  /**
   * Executes the authentication on ATBC.
   * @returns the result of a success full authentication or throws an exception
   * in case the result is anything different from HTTP 200 code.
   */
  private async ATBCLogin(): Promise<ATBCAuthTokenResponse> {
    try {
      const agent = new (require("https").Agent)({
        rejectUnauthorized: false,
      });

      const authRequest = await axios.post(
        this.config.ATBCloginEndpoint,
        {
          usr: this.config.ATBCUserName,
          pwd: this.config.ATBCPassword,
          app: this.config.ATBCApp,
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
  public async ATBCcreateClient(
    payload: ATBCCreateClientPayload,
  ): Promise<ATBCCreateClientResponse> {
    try {
      const config = await this.getConfig();
      const res = await axios.post(
        this.config.ATBCClientCreateEndpoint,
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
  /**
   * Check PD status of the student with SIN number on ATBC.
   * @returns the result of a success full authentication or throws an exception
   * in case the result is anything different from HTTP 200 code.
   */
  public async ATBCPDChecker(
    payload: ATBCPDCheckerPayload,
  ): Promise<ATBCPDCheckerResponse> {
    try {
      const config = await this.getConfig();
      const res = await axios.post(
        this.config.ATBCSinInfoEndpoint,
        payload,
        config,
      );
      return res?.data as ATBCPDCheckerResponse;
    } catch (excp) {
      this.logger.error(
        `Received exception while checking the PD status at ATBC`,
      );
      this.logger.error(excp);
      throw excp;
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
