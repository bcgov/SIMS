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
import { needRenewJwtToken } from "../../utilities/auth-utils";

// Expected header name to send the authorization token to formio API.
const FORMIO_TOKEN_NAME = "x-jwt-token";
// Amount of seconds before the token expires that should be
// considered to renew it. For instance, if a token has 10min
// expiration and the below const is defined as 30, the token will
// be renewed if the token was acquired 9min30s ago or if it is
// already expired.
const FORMIO_TOKEN_RENEWAL_SECONDS = 30;

@Injectable()
export class FormService {
  @InjectLogger()
  logger: LoggerService;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

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
    const token = await this.tryGetCachedToken();
    return {
      headers: {
        [FORMIO_TOKEN_NAME]: token.token,
      },
    };
  }

  /**
   * Cached token for Form.IO service, managed
   * by the method tryGetCachedToken.
   */
  private cachedToken: {
    token: any;
    decoded: any;
  };

  /**
   * Tries get the token from the cache if it is not expired
   * or about to be expired, otherwise get a new one.
   * @returns Cached token or a new one.
   */
  private async tryGetCachedToken(): Promise<{ token: any; decoded: any }> {
    const needRenewToken =
      !this.cachedToken || // If the token is not present, retrieve it.
      needRenewJwtToken(
        +this.cachedToken.decoded["exp"],
        FORMIO_TOKEN_RENEWAL_SECONDS,
      ); // If the token is about to expire, retrieve it.

    if (needRenewToken) {
      const token = await this.getAuthToken();
      const decoded = this.jwtService.decode(token);
      this.cachedToken = {
        token,
        decoded,
      };
    }

    return this.cachedToken;
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
}
