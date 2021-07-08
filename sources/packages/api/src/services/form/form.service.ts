import { HttpStatus, Injectable } from "@nestjs/common";
import {
  FormsConfig,
  DryRunSubmissionResult,
  SubmissionResult,
} from "../../types";
import { ConfigService } from "../config/config.service";
import axios from "axios";
import { LoggerService } from "../../logger/logger.service";
import { InjectLogger } from "../../common";
import { JwtService } from "@nestjs/jwt";
import { TokenCacheService } from "..";
import { TokenCacheResponse } from "../auth/token-cache.service.models";

// Expected header name to send the authorization token to formio API.
const FORMIO_TOKEN_NAME = "x-jwt-token";

@Injectable()
export class FormService {
  private tokenCacheService: TokenCacheService = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.tokenCacheService = new TokenCacheService("Form.IO", () =>
      this.getToken(),
    );
  }

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
   * Validate and save the data to the From IO environment generating also
   * the absolute path for the formio generated submission.
   * @param formName Name of the form to be saved.
   * @param data Data to be saved.
   * @returns Submission related information from formio submission result.
   */
  async submission(formName: string, data: any): Promise<SubmissionResult> {
    try {
      const authHeader = await this.createAuthHeader();
      const response = await axios.post(
        `${this.config.formsUrl}/${formName}/submission`,
        { data },
        authHeader,
      );
      const absolutePath = `${this.config.formsUrl}/form/${response.data.form}/submission/${response.data._id}`;
      return {
        submissionId: response.data._id,
        state: response.data.state,
        data: response.data.data,
        formId: response.data.form,
        absolutePath,
        valid: true,
      };
    } catch (error) {
      if (error.response.status === HttpStatus.BAD_REQUEST) {
        return { valid: false } as SubmissionResult;
      }
      this.logger.error(
        `Error while executing the submission of the form ${formName}`,
      );
      throw error;
    }
  }

  /**
   * Creates the expected authorization header to authorize the formio API.
   * @returns header to be added to HTTP request.
   */
  private async createAuthHeader() {
    const token = await this.tokenCacheService.getToken();
    return {
      headers: {
        [FORMIO_TOKEN_NAME]: token,
      },
    };
  }

  /**
   * Executes the token request and (alongside with TokenCacheService)
   * allows it to be cache until it expires.
   * @returns token and expiration to be cached.
   */
  private async getToken(): Promise<TokenCacheResponse> {
    const token = await this.getAuthToken();
    const decoded = this.jwtService.decode(token);
    return {
      accessToken: token,
      expiresIn: +decoded["exp"],
    };
  }

  /**
   * Gets the authentication token value to authorize the formio API.
   * @returns the token that is needed to authentication on the formio API.
   */
  private async getAuthToken() {
    const authResponse = await this.getUserLogin();
    return authResponse.headers[FORMIO_TOKEN_NAME];
  }

  /**
   * Executes the authentication on formio API.
   * @returns the result of a sucessfull authentication or thows an expection
   * in case the result is anything different from HTTP 200 code.
   */
  private async getUserLogin() {
    try {
      const authRequest = await axios.post(
        `${this.config.formsUrl}/user/login`,
        {
          data: {
            email: this.config.serviceAccountCredential.userName,
            password: this.config.serviceAccountCredential.password,
          },
        },
      );

      return authRequest;
    } catch (excp) {
      this.logger.error(`Received exception while getting form SA token`);
      this.logger.error(
        `${JSON.stringify(
          {
            status: excp.response.status,
            statusText: excp.response.statusText,
            data: excp.response.data,
          },
          null,
          2,
        )}`,
      );
      throw excp;
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
