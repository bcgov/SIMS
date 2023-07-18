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
  ATBCDisabilityStatusResponse,
} from "./models/atbc.model";
import { HttpService } from "@nestjs/axios";
import { formatDate } from "@sims/utilities";

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
  private async getATBCEndpointConfig(): Promise<ATBCHeader> {
    const loginResponse = await this.loginToATBC();
    const accessToken = loginResponse.accessToken;
    return {
      headers: { Authorization: `Bearer ${accessToken}` },
      // (NOTE: this will disable client verification)
      // TODO: add certificate for PROD
      httpsAgent: new (require("https").Agent)({
        rejectUnauthorized: false,
      }),
    };
  }

  /**
   * Check for student PD updates.
   * @param student student.
   * @returns PD status response.
   */
  async getStudentDisabilityStatusUpdatesByDate(
    date?: Date,
  ): Promise<ATBCDisabilityStatusResponse[]> {
    const processingDate = date ?? new Date();
    const processingDateString = formatDate(processingDate, "YYYY/MM/DD");
    try {
      this.logger.log("Checking for student disability status updates.");

      const headers = await this.getATBCEndpointConfig();
      const apiEndpoint = `${this.config.ATBCEndpoint}/sfas?sfasDate=${processingDateString}`;
      const studentPDUpdateResponse = await this.httpService.axiosRef.get<
        ATBCDisabilityStatusResponse[]
      >(apiEndpoint, headers);
      return studentPDUpdateResponse.data;
    } catch (error: unknown) {
      this.logger.error(
        `Unexpected error occurred while checking for student disability status updates.`,
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
  async loginToATBC(): Promise<ATBCAuthTokenResponse> {
    try {
      const agent = new (require("https").Agent)({
        rejectUnauthorized: false,
      });

      const authRequest = await this.httpService.axiosRef.post(
        this.config.ATBCLoginEndpoint,
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
  async createClient(
    payload: ATBCCreateClientPayload,
  ): Promise<ATBCCreateClientResponse> {
    try {
      const config = await this.getATBCEndpointConfig();
      const apiEndpoint = `${this.config.ATBCEndpoint}/pd-clients`;
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
  /**
   * Check PD status of the student with SIN number on ATBC.
   * @returns the result of a success full authentication or throws an exception
   * in case the result is anything different from HTTP 200 code.
   */
  private async checkPDStatus(
    payload: ATBCPDCheckerPayload,
  ): Promise<ATBCPDCheckerResponse> {
    try {
      const config = await this.getATBCEndpointConfig();
      const apiEndpoint = `${this.config.ATBCEndpoint}/pd`;
      const res = await this.httpService.axiosRef.post(
        apiEndpoint,
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
