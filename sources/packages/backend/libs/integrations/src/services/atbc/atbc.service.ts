import { Injectable } from "@nestjs/common";
import { ATBCIntegrationConfig, ConfigService } from "@sims/utilities/config";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import { ATBCHeader, ATBCAuthTokenResponse } from "./models/atbc-auth.model";
import {
  ATBCCreateClientResponse,
  ATBCCreateClientPayload,
  ATBCPDCheckerResponse,
  ATBCPDCheckerPayload,
  ATBCStudentModel,
} from "./models/atbc.model";
import { firstValueFrom } from "rxjs";
import { HttpService } from "@nestjs/axios";

@Injectable()
export class ATBCService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.logger.log("[Created]");
  }

  private get config(): ATBCIntegrationConfig {
    return this.configService.atbcIntegration;
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
    const authResponse = await this.loginToATBC();
    return authResponse?.accessToken;
  }

  /**
   * Executes the authentication on ATBC.
   * @returns the result of a success full authentication or throws an exception
   * in case the result is anything different from HTTP 200 code.
   */
  async loginToATBC(): Promise<ATBCAuthTokenResponse> {
    try {
      const agent = new (require("https").Agent)({
        rejectUnauthorized: false,
      });

      const authRequest = await firstValueFrom(
        this.httpService.post(
          this.config.ATBCLoginEndpoint,
          {
            usr: this.config.ATBCUserName,
            pwd: this.config.ATBCPassword,
            app: this.config.ATBCApp,
          },
          { httpsAgent: agent },
        ),
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
      const config = await this.getConfig();
      const apiEndpoint = `${this.config.ATBCEndpoint}/pd-clients`;
      const res = await firstValueFrom(
        this.httpService.post(apiEndpoint, payload, config),
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
  private async checkPDStatus(
    payload: ATBCPDCheckerPayload,
  ): Promise<ATBCPDCheckerResponse> {
    try {
      const config = await this.getConfig();
      const apiEndpoint = `${this.config.ATBCEndpoint}/pd`;
      const res = await firstValueFrom(
        this.httpService.post(apiEndpoint, payload, config),
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

  /**
   * Check PD status for a student.
   * @param student student.
   * @returns PD status response.
   */
  async checkStudentPDStatus(
    student: ATBCStudentModel,
  ): Promise<ATBCPDCheckerResponse> {
    try {
      // create PD checker payload
      const payload: ATBCPDCheckerPayload = {
        id: student.sin,
      };
      // api to check the student PD status in ATBC
      this.logger.log(`Checking PD status of student ${student.id}`);
      // try {
      return await this.checkPDStatus(payload);
    } catch (excp) {
      this.logger.error(
        `Received exception while checking the PD status of student ${student.id} at ATBC`,
      );
      this.logger.error(excp);
      throw excp;
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
