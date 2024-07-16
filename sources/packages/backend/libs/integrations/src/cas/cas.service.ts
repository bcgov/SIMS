import { Injectable } from "@nestjs/common";
import {
  CASAuthDetails,
  CASSupplierResponse,
} from "./models/cas-supplier-response.model";
import { AxiosRequestConfig } from "axios";
import { HttpService } from "@nestjs/axios";
import { CASIntegrationConfig, ConfigService } from "@sims/utilities/config";
import { stringify } from "querystring";

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
    const response = await this.httpService.axiosRef.post(url, data, config);
    return response.data;
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
    const url = `${this.casIntegrationConfig.baseUrl}/cfs/supplier/${lastName}/lastname/${sin}/sin`;
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    const config: AxiosRequestConfig = {
      headers,
    };
    const response = await this.httpService.axiosRef.get(url, config);
    return response.data;
  }
}
