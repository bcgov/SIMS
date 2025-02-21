import { HttpStatus, Injectable, LoggerService } from "@nestjs/common";
import {
  CASAuthDetails,
  CASSupplierResponse,
  CreateExistingSupplierAndSiteSubmittedData,
  CreateExistingSupplierSiteData,
  CreateExistingSupplierSiteResponse,
  CreateSupplierAddressSubmittedData,
  CreateSupplierAndSiteData,
  CreateSupplierAndSiteResponse,
  CreateSupplierAndSiteSubmittedData,
  CreateSupplierSite,
  PendingInvoicePayload,
  SendPendingInvoicesResponse,
} from "./models/cas-service.model";
import { AxiosError, AxiosRequestConfig } from "axios";
import { HttpService } from "@nestjs/axios";
import { CASIntegrationConfig, ConfigService } from "@sims/utilities/config";
import { stringify } from "querystring";
import {
  CustomNamedError,
  convertToASCIIString,
  parseJSONError,
} from "@sims/utilities";
import { CAS_AUTH_ERROR, CAS_BAD_REQUEST } from "@sims/integrations/constants";
import { InjectLogger } from "@sims/utilities/logger";
import {
  CASCachedAuthDetails,
  formatAddress,
  formatCity,
  formatPostalCode,
  formatUserName,
} from ".";

/**
 * CAS response property that contains further information about errors.
 */
const CAS_RETURNED_MESSAGES = "CAS-Returned-Messages";

@Injectable()
export class CASService {
  private cachedCASToken: CASCachedAuthDetails;
  private readonly casIntegrationConfig: CASIntegrationConfig;

  constructor(
    config: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.casIntegrationConfig = config.casIntegration;
  }

  /**
   * Request to login on CAS API and return CAS auth details with the
   * token used for authentication in all other requests.
   * The token is cached for future requests.
   * @returns CAS auth details.
   */
  async getToken(): Promise<CASAuthDetails> {
    if (this.cachedCASToken && !this.cachedCASToken.requiresRenewal()) {
      // Check if there is a cached token and it is not about to expire.
      return this.cachedCASToken.authDetails;
    }
    const url = `${this.casIntegrationConfig.baseUrl}/oauth/token`;
    const auth = Buffer.from(
      `${this.casIntegrationConfig.clientCredential.clientId}:${this.casIntegrationConfig.clientCredential.clientSecret}`,
    ).toString("base64");
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    };
    const body = { grant_type: "client_credentials" };
    const config: AxiosRequestConfig = {
      headers,
    };
    const data = stringify(body);
    try {
      const response = await this.httpService.axiosRef.post(url, data, config);
      // Cache the token for future requests.
      this.cachedCASToken = new CASCachedAuthDetails(response.data);
      return this.cachedCASToken.authDetails;
    } catch (error: unknown) {
      this.logger.error(
        `Error while logging on CAS API. ${parseJSONError(error)}`,
      );
      throw new CustomNamedError(
        "Could not authenticate on CAS.",
        CAS_AUTH_ERROR,
      );
    }
  }

  /**
   * Get authenticated header to execute API calls.
   * @returns authenticated header configuration.
   */
  private async getAuthConfig(): Promise<AxiosRequestConfig> {
    const auth = await this.getToken();
    const headers = {
      Authorization: `Bearer ${auth.access_token}`,
    };
    return { headers };
  }

  /**
   * Requests supplier information from CAS API.
   * @param token auth token.
   * @param sin student's sin.
   * @param lastName student's last name.
   * @returns CAS supplier response.
   */
  async getSupplierInfoFromCAS(
    sin: string,
    lastName: string,
  ): Promise<CASSupplierResponse> {
    const convertedLastName = convertToASCIIString(lastName).toUpperCase();
    const url = `${this.casIntegrationConfig.baseUrl}/cfs/supplier/${convertedLastName}/lastname/${sin}/sin`;
    let response: { data: CASSupplierResponse };
    try {
      const config = await this.getAuthConfig();
      response = await this.httpService.axiosRef.get(url, config);
    } catch (error: unknown) {
      this.handleBadRequestError(
        error,
        "Unexpected error while requesting supplier.",
      );
    }
    return response?.data;
  }

  /**
   * Send pending invoices to CAS.
   * @param supplierData data to be used for supplier and site creation.
   * @returns submitted data and CAS response.
   */
  async sendPendingInvoices(
    pendingInvoicePayload: PendingInvoicePayload,
  ): Promise<SendPendingInvoicesResponse> {
    const url = `${this.casIntegrationConfig.baseUrl}/cfs/apinvoice/`;
    let response;
    try {
      const config = await this.getAuthConfig();
      response = await this.httpService.axiosRef.post(
        url,
        pendingInvoicePayload,
        config,
      );
    } catch (error: unknown) {
      this.handleBadRequestError(
        error,
        "Error while sending pending invoices to CAS.",
      );
    }
    return response?.data;
  }

  /**
   * Create supplier and site.
   * @param token authentication token.
   * @param supplierData data to be used for supplier and site creation.
   * @returns submitted data and CAS response.
   */
  async createSupplierAndSite(
    supplierData: CreateSupplierAndSiteData,
  ): Promise<CreateSupplierAndSiteResponse> {
    const url = `${this.casIntegrationConfig.baseUrl}/cfs/supplier/`;
    try {
      const config = await this.getAuthConfig();
      const supplierAddress = this.getSupplierAddress(
        supplierData.supplierSite,
        supplierData.emailAddress,
      );
      const submittedData: CreateSupplierAndSiteSubmittedData = {
        SupplierName: formatUserName(
          supplierData.firstName,
          supplierData.lastName,
        ),
        SubCategory: "Individual",
        Sin: supplierData.sin,
        SupplierAddress: [supplierAddress],
      };
      const response = await this.httpService.axiosRef.post(
        url,
        submittedData,
        config,
      );
      return {
        submittedData,
        response: {
          supplierNumber: response.data.SUPPLIER_NUMBER,
          supplierSiteCode: this.extractSupplierSiteCode(
            response.data.SUPPLIER_SITE_CODE,
          ),
        },
      };
    } catch (error: unknown) {
      this.handleBadRequestError(
        error,
        "Error while creating supplier and site on CAS.",
      );
    }
  }

  /**
   * Create supplier site for existing supplier.
   * @param supplierData data to be used for supplier and site creation.
   * @returns submitted data and CAS response.
   */
  async createSiteForExistingSupplier(
    supplierData: CreateExistingSupplierSiteData,
  ): Promise<CreateExistingSupplierSiteResponse> {
    const url = `${this.casIntegrationConfig.baseUrl}/cfs/supplier/${supplierData.supplierNumber}/site`;
    try {
      const config = await this.getAuthConfig();
      const supplierAddress = this.getSupplierAddress(
        supplierData.supplierSite,
        supplierData.emailAddress,
      );
      const submittedData: CreateExistingSupplierAndSiteSubmittedData = {
        SupplierNumber: supplierData.supplierNumber,
        SupplierAddress: [supplierAddress],
      };
      const response = await this.httpService.axiosRef.post(
        url,
        submittedData,
        config,
      );
      return {
        submittedData,
        response: {
          supplierNumber: response.data.SUPPLIER_NUMBER,
          supplierSiteCode: this.extractSupplierSiteCode(
            response.data.SUPPLIER_SITE_CODE,
          ),
        },
      };
    } catch (error: unknown) {
      this.handleBadRequestError(
        error,
        "Error while creating site for existing supplier on CAS.",
      );
    }
  }

  /**
   * Replace the characters [] and white spaces from the supplier
   * site code returned from CAS (e.g. '[001] ').
   * @param casSupplierSiteCode supplier site code returned from CAS.
   * @returns supplier site code expected to be persisted for later
   * use (e.g. 001);
   */
  private extractSupplierSiteCode(casSupplierSiteCode: string): string {
    return casSupplierSiteCode.replace(/\[|]|\s/g, "");
  }

  /**
   * Obtains the supplier address object for based on supplierData being either
   * the CreateSupplierAndSiteData or CreateExistingSupplierSiteData class.
   * @param supplierSite supplier site data to get supplier address.
   * @param emailAddress email address for the supplier address.
   * @returns formatted supplier address data.
   */
  private getSupplierAddress(
    supplierSite: CreateSupplierSite,
    emailAddress: string,
  ): CreateSupplierAddressSubmittedData {
    const supplierAddress = {
      AddressLine1: formatAddress(supplierSite.addressLine1),
      City: formatCity(supplierSite.city),
      Province: supplierSite.provinceCode,
      Country: "CA",
      PostalCode: formatPostalCode(supplierSite.postalCode),
      EmailAddress: emailAddress,
    };
    return supplierAddress;
  }

  /**
   * Handles bad request errors from CAS API.
   * @param error The error object caught during the request.
   * @param defaultMessage The default message to throw for non-specific errors.
   */
  private handleBadRequestError(error: unknown, defaultMessage: string): never {
    if (
      error instanceof AxiosError &&
      error.response?.status === HttpStatus.BAD_REQUEST &&
      !!error.response?.data[CAS_RETURNED_MESSAGES]
    ) {
      const casKnownErrors = error.response.data[
        CAS_RETURNED_MESSAGES
      ] as string;
      const casKnownErrorArray = casKnownErrors
        .split("|")
        .map((error) => error.trim());
      throw new CustomNamedError(
        "CAS Bad Request Errors",
        CAS_BAD_REQUEST,
        casKnownErrorArray,
      );
    }
    throw new Error(defaultMessage, { cause: error });
  }

  @InjectLogger()
  logger: LoggerService;
}
