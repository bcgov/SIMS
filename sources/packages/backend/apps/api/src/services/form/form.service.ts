import { HttpStatus, Injectable } from "@nestjs/common";
import { DryRunSubmissionResult } from "../../types";
import { ConfigService, FormsConfig } from "@sims/utilities/config";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import { JwtService } from "@nestjs/jwt";
import { TokenCacheService } from "..";
import { TokenCacheResponse } from "../auth/token-cache.service.models";
import { HttpService } from "@nestjs/axios";
import { FormDefinition } from "./form.service.models";

// Expected header name to send the authorization token to formio API.
const FORMIO_TOKEN_NAME = "x-jwt-token";

@Injectable()
export class FormService {
  private tokenCacheService: TokenCacheService = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly httpService: HttpService,
  ) {
    this.tokenCacheService = new TokenCacheService("Form.IO", () =>
      this.getToken(),
    );
  }

  get config(): FormsConfig {
    return this.configService.forms;
  }

  /**
   * Get a form definition from formio.
   * @param formName Name of the form to be retrieved.
   * @returns Form definition.
   */
  async fetch(formName: string) {
    const authHeader = await this.createAuthHeader();
    const content = await this.httpService.axiosRef.get(
      `${this.config.formsUrl}/${formName}`,
      authHeader,
    );
    return content.data;
  }

  /**
   * Lists form definitions that contains the tag 'common' ordered by title.
   */
  async list(): Promise<FormDefinition[]> {
    const authHeader = await this.createAuthHeader();
    const content = await this.httpService.axiosRef.get(
      `${this.config.formsUrl}/form?tags=common&limit=100&sort=title`,
      authHeader,
    );
    return content.data.map((form: FormDefinition) => ({
      name: form.name,
      title: form.title,
    }));
  }

  /**
   * Updates a form definition in Form.io.
   * @param formAlias alias of the form to be updated.
   * @param formDefinition the new definition of the form.
   */
  async updateForm(formAlias: string, formDefinition: unknown) {
    const authHeader = await this.createAuthHeader();
    await this.httpService.axiosRef.put(
      `${this.config.formsUrl}/${formAlias}`,
      formDefinition,
      authHeader,
    );
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
   * alongside with the data after formio processing.
   */
  async dryRunSubmission<T = any>(
    formName: string,
    data: unknown,
  ): Promise<DryRunSubmissionResult<T>> {
    try {
      const authHeader = await this.createAuthHeader();
      const submissionResponse = await this.httpService.axiosRef.post(
        `${this.config.formsUrl}/${formName}/submission?dryRun=1`,
        { data },
        authHeader,
      );

      return { valid: true, data: submissionResponse.data, formName };
    } catch (error) {
      if (error.response?.data) {
        this.logger.warn(
          "Error while executing the Form.IO dryRun validation. Please see below the validation errors.",
        );
        this.logger.warn(error.response.data);
      }
      if (error.response.status === HttpStatus.BAD_REQUEST) {
        return { valid: false, formName };
      }
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
      const authRequest = await this.httpService.axiosRef.post(
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
