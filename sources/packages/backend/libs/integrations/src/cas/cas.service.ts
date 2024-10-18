import { Injectable, LoggerService } from "@nestjs/common";
import {
  CASAuthDetails,
  CASSupplierResponse,
  CreateSupplierAndSiteData,
  CreateSupplierAndSiteResponse,
  CreateSupplierAndSiteSubmittedData,
} from "./models/cas-service.model";
import { AxiosRequestConfig } from "axios";
import { HttpService } from "@nestjs/axios";
import { CASIntegrationConfig, ConfigService } from "@sims/utilities/config";
import { stringify } from "querystring";
import {
  CustomNamedError,
  convertToASCII,
  parseJSONError,
} from "@sims/utilities";
import { CAS_AUTH_ERROR } from "@sims/integrations/constants";
import { InjectLogger } from "@sims/utilities/logger";
import {
  formatAddress,
  formatCity,
  formatPostalCode,
  formatUserName,
} from "@sims/integrations/cas";

@Injectable()
export class CASService {
  private readonly casIntegrationConfig: CASIntegrationConfig;
  constructor(
    config: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.casIntegrationConfig = config.casIntegration;
  }

  /**
   * Request to login on CAS API and return CAS auth details with the token used for authentication in all other requests.
   * @returns CAS auth details.
   */
  async logon(): Promise<CASAuthDetails> {
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
      return response.data;
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
   * Requests supplier information from CAS API.
   * @param token auth token.
   * @param sin student's sin.
   * @param lastName student's last name.
   * @returns CAS supplier response.
   */
  async getSupplierInfoFromCAS(
    token: string,
    sin: string,
    lastName: string,
  ): Promise<CASSupplierResponse> {
    const convertedLastName = convertToASCII(lastName).toUpperCase();
    const url = `${this.casIntegrationConfig.baseUrl}/cfs/supplier/${convertedLastName}/lastname/${sin}/sin`;
    let response: { data: CASSupplierResponse };
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };
      const config: AxiosRequestConfig = {
        headers,
      };
      response = await this.httpService.axiosRef.get(url, config);
    } catch (error: unknown) {
      throw new Error("Unexpected error while requesting supplier.", {
        cause: error,
      });
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
    token: string,
    supplierData: CreateSupplierAndSiteData,
  ): Promise<CreateSupplierAndSiteResponse> {
    const url = `${this.casIntegrationConfig.baseUrl}/cfs/supplier/`;
    try {
      const config: AxiosRequestConfig = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const submittedData: CreateSupplierAndSiteSubmittedData = {
        SupplierName: formatUserName(
          supplierData.lastName,
          supplierData.firstName,
        ),
        SubCategory: "Individual",
        Sin: supplierData.sin,
        SupplierAddress: [
          {
            AddressLine1: formatAddress(supplierData.supplierSite.addressLine1),
            City: formatCity(supplierData.supplierSite.city),
            Province: supplierData.supplierSite.provinceCode,
            Country: "CA",
            PostalCode: formatPostalCode(supplierData.supplierSite.postalCode),
            EmailAddress: supplierData.emailAddress,
          },
        ],
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
      throw new Error("Error while creating supplier and site on CAS.", {
        cause: error,
      });
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

  @InjectLogger()
  logger: LoggerService;
}
