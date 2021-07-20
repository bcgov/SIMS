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
import { Student } from "../../database/entities";
import { StudentService } from "../../services";
import { ATBCPDStatus } from "./atbc.models";

@Injectable()
export class ATBCService {
  constructor(
    private readonly configService: ConfigService,
    private readonly studentService: StudentService,
  ) {
    this.logger.log("[Created]");
  }

  private get config(): ATBCIntegrationConfig {
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
  public async ATBCLogin(): Promise<ATBCAuthTokenResponse> {
    try {
      const agent = new (require("https").Agent)({
        rejectUnauthorized: false,
      });

      const authRequest = await axios.post(
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
  public async ATBCCreateClient(
    payload: ATBCCreateClientPayload,
  ): Promise<ATBCCreateClientResponse> {
    try {
      const config = await this.getConfig();
      const apiEndpoint = `${this.config.ATBCEndpoint}/pd-clients`;
      const res = await axios.post(apiEndpoint, payload, config);
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
  private async ATBCPDChecker(
    payload: ATBCPDCheckerPayload,
  ): Promise<ATBCPDCheckerResponse> {
    try {
      const config = await this.getConfig();
      const apiEndpoint = `${this.config.ATBCEndpoint}/pd`;
      const res = await axios.post(apiEndpoint, payload, config);
      return res?.data as ATBCPDCheckerResponse;
    } catch (excp) {
      this.logger.error(
        `Received exception while checking the PD status at ATBC`,
      );
      this.logger.error(excp);
      throw excp;
    }
  }

  public async PDCheckerProcess(eachStudent: Student) {
    try {
      this.logger.log(`Creating Payload for student id ${eachStudent.id}`);
      // create PD checker payload
      const payload: ATBCPDCheckerPayload = {
        id: eachStudent.sin,
      };
      // api to check the student PD status in ATBC
      this.logger.log(
        `Check starting for PD status of student ${eachStudent.id}`,
      );
      // try {
      const response = await this.ATBCPDChecker(payload);
      // e9yStatusId === 1 , PD Confirmed
      // e9yStatusId === 2 , PD Denied
      // e9yStatusId === 0 , Processing, In Queue

      this.logger.log(
        `PD Status for student ${eachStudent.id}, status ${response?.e9yStatusId} ${response?.e9yStatus}, `,
      );
      if (
        response?.e9yStatusId === ATBCPDStatus.Confirmed ||
        response?.e9yStatusId === ATBCPDStatus.Denied
      ) {
        // code to set PD Status
        let status = false;
        if (response?.e9yStatusId === 1) {
          status = true;
        }
        this.logger.log(
          `Updating PD Status for student ${eachStudent.id}, status ${response?.e9yStatusId} ${response?.e9yStatus}, `,
        );
        await this.studentService.updatePDStatusNDate(eachStudent.id, status);
      }
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
