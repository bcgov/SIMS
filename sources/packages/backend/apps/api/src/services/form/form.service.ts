import { HttpStatus, Injectable } from "@nestjs/common";
import { DryRunSubmissionResult } from "../../types";
import { ConfigService, FormsConfig } from "@sims/utilities/config";
import { LoggerService } from "@sims/utilities/logger";
import { HttpService } from "@nestjs/axios";
import { AxiosRequestConfig, isAxiosError } from "axios";
import { FormDefinition } from "./form.service.models";

/**
 * Expected header name to send the authorization token to formio API.
 */
const FORMIO_TOKEN_NAME = "x-token";
/**
 * Form.io list method requires some pagination number,
 * otherwise it returns only 10 records.
 */
const FORMIO_PAGE_LIMIT = 100;
/**
 * Form.io list method sorting field.
 */
const FORMIO_LIST_SORT_FIELD = "title";

@Injectable()
export class FormService {
  private readonly config: FormsConfig;
  private readonly authHeader: AxiosRequestConfig;

  constructor(
    private readonly httpService: HttpService,
    private readonly logger: LoggerService,
    configService: ConfigService,
  ) {
    this.config = configService.forms;
    this.authHeader = {
      headers: {
        [FORMIO_TOKEN_NAME]: this.config.apiKey,
      },
    };
  }

  /**
   * Get a form definition from formio.
   * @param formPath path of the form to be retrieved.
   * @returns Form definition.
   */
  async fetch(formPath: string) {
    const content = await this.httpService.axiosRef.get(
      `${this.config.formsUrl}/${formPath}`,
      this.authHeader,
    );
    return content.data;
  }

  /**
   * Lists form definitions that contains the tag 'common' ordered by title.
   * @returns list of form definitions.
   */
  async list(): Promise<FormDefinition[]> {
    const content = await this.httpService.axiosRef.get(
      `${this.config.formsUrl}/form?tags=common&limit=${FORMIO_PAGE_LIMIT}&sort=${FORMIO_LIST_SORT_FIELD}`,
      this.authHeader,
    );
    return content.data.map((form: FormDefinition) => ({
      title: form.title,
      path: form.path,
    }));
  }

  /**
   * Updates a form definition in Form.io server.
   * @param formPath form path of the form to be updated.
   * @param formDefinition the new definition of the form.
   */
  async updateForm(formPath: string, formDefinition: unknown): Promise<void> {
    await this.httpService.axiosRef.put(
      `${this.config.formsUrl}/${formPath}`,
      formDefinition,
      this.authHeader,
    );
  }

  /**
   * Drys run submission allows the data to be validated by Formio API and also to
   * returned a processed data model more close to what would be saved on Formio.
   * For instance, formio allows that the form elements be defined to not be stored
   * on the server side, this kind of validations will be applied during this
   * API call and the result will be the data after processed by formio.
   * Please note that the data will not be saved on formio database.
   * @param formName path of the form to be validated.
   * @param data Data to be validated/processed.
   * @returns Status indicating if the data being submitted is valid or not
   * alongside with the data after formio processing.
   */
  async dryRunSubmission<T = any>(
    formName: string,
    data: unknown,
  ): Promise<DryRunSubmissionResult<T>> {
    try {
      const submissionResponse = await this.httpService.axiosRef.post(
        `${this.config.formsUrl}/${formName}/submission?dryRun=1`,
        { data },
        this.authHeader,
      );
      return { valid: true, data: submissionResponse.data, formName };
    } catch (error: unknown) {
      if (!isAxiosError(error)) {
        throw error;
      }
      if (error.response?.data) {
        this.logger.warn(
          "Error while executing the Form.IO dryRun validation. Please see below the validation errors.",
        );
        this.logger.warn(error.response.data);
      }
      if (error.response?.status === HttpStatus.BAD_REQUEST) {
        return { valid: false, formName };
      }
      throw error;
    }
  }
}
