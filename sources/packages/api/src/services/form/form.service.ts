import { HttpStatus, Injectable } from "@nestjs/common";
import { FormsConfig } from "src/types";
import { ConfigService } from "../config/config.service";
import axios from "axios";

// Expected header name to send the authorization token to formio API.
const FORMIO_TOKEN_NAME = "x-jwt-token";

@Injectable()
export class FormService {
  constructor(private readonly configService: ConfigService) {}

  get config(): FormsConfig {
    return this.configService.getConfig().forms;
  }

  async fetch(formName: string) {
    const authHeader = await this.createAuthHeader();
    const content = await axios.get(
      `${this.config.formsUrl}/${formName}`,
      authHeader,
    );
    return content.data;
  }

  async list() {
    return (
      await axios.get(`${this.config.formsUrl}/form?type=form&tags=common`)
    ).data;
  }

  /**
   * Creates the expected authorization header to authorize the formio API.
   * @returns header to be added to HTTP request.
   */
  private async createAuthHeader() {
    const token = await this.getAuthToken();
    return {
      headers: {
        [FORMIO_TOKEN_NAME]: token,
      },
    };
  }

  /**
   * Gets the authentication token value to authorize the formio API.
   * @returns the token that is needed to authentication on the formio API.
   */
  private async getAuthToken() {
    // TODO: Cache the token ultil it expires and just request a new one
    // when there is no token in the cache or it is about to expire.
    const authResponse = await this.getUserLogin();
    return authResponse.headers[FORMIO_TOKEN_NAME];
  }

  /**
   * Executes the authentication on formio API.
   * @returns the result of a sucessfull authentication or thows an expection
   * in case the result is anything different from HTTP 200 code.
   */
  private async getUserLogin() {
    const authRequest = await axios.post(`${this.config.formsUrl}/user/login`, {
      data: {
        email: this.config.serviceAccountCredential.userName,
        password: this.config.serviceAccountCredential.password,
      },
    });

    if (authRequest.status !== HttpStatus.OK) {
      throw new Error(
        `Error while retrieving formio authentication token. Error ${authRequest.status}: ${authRequest.statusText}`,
      );
    }

    return authRequest;
  }
}
