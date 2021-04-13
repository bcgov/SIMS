import { HttpStatus, Injectable } from "@nestjs/common";
import { FormsConfig, DryRunSubmissionResult } from "../../types";
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

  /**
   * Get a form definition from formio.
   * @param formName Name of the form to be retrieved.
   * @returns Form definition.
   */
  async fetch(formName: string) {
    const authHeader = await this.createAuthHeader();
    const content = await axios.get(
      `${this.config.formsUrl}/${formName}`,
      authHeader,
    );
    return content.data;
  }

  /**
   * Lists form definitions that contains the tag 'common'.
   */
  async list() {
    return (
      await axios.get(`${this.config.formsUrl}/form?type=form&tags=common`)
    ).data;
  }

  /**
   * Drys run submission allows the data to be validated by Formio API and also to
   * returned a processed data model more close to what would be saved on Formio.
   * For instance, formio allows that the form elements be defined to not be stored
   * on the server side, this kind of validations will be applied during this
   * API call and the result will be the data after processed by formio.
   * Please note that the data will not be saved on formio database.
   * @param formName Name of the form to be validated.
   * @param data Data to be validated/processed.
   * @returns Status indicating if the data being submitted is valid or not
   * alongside with the data after formio procecessing.
   */
  async dryRunSubmission(
    formName: string,
    data: any,
  ): Promise<DryRunSubmissionResult> {
    try {
      const authHeader = await this.createAuthHeader();
      const submissionResponse = await axios.post(
        `${this.config.formsUrl}/${formName}/submission?dryrun=1`,
        { data },
        authHeader,
      );
      return { valid: true, data: submissionResponse.data };
    } catch (error) {
      if (error.response.status === HttpStatus.BAD_REQUEST) {
        return { valid: false };
      }
      throw error;
    }
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
