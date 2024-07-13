import { Injectable } from "@nestjs/common";
import { CASAuthDetails, CASSupplierResponse } from "../../processors/schedulers/cas-integration/models/cas-supplier-response.dto";
import { AxiosRequestConfig } from "axios";
import { HttpService } from "@nestjs/axios";
import { InjectRepository } from "@nestjs/typeorm";
import { CASSupplier } from "@sims/sims-db";
import { CASIntegrationConfig, ConfigService } from "@sims/utilities/config";
import { Repository } from "typeorm";

@Injectable()
export class CASService {
  private readonly casIntegrationConfig: CASIntegrationConfig;
  constructor(
    config: ConfigService,
    private readonly httpService: HttpService,
    @InjectRepository(CASSupplier)
    private readonly casSupplierRepo: Repository<CASSupplier>,
  ) {
    this.casIntegrationConfig = config.casIntegration;
  }
  /**
   * TODO comments
   * TODO return type
   * @returns
   */
  public async casLogon(): Promise<CASAuthDetails> {
    const url = `${this.casIntegrationConfig.baseUrl}/oauth/token`;
    const auth = Buffer.from(
      `${this.casIntegrationConfig.clientId}:${this.casIntegrationConfig.clientSecret}`,
    ).toString("base64");
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    };
    const body = new URLSearchParams();
    body.append("grant_type", "client_credentials");
    const config: AxiosRequestConfig = {
      headers,
    };
    const response = await this.httpService.axiosRef.post(
      url,
      body.toString(),
      config,
    );
    return response.data;
  }

  /**
   * TODO comments
   * @param token
   * @param sin
   * @param surname
   * @returns
   */
  public async getSupplierInfoFromCAS(
    token: string,
    sin: string,
    surname: string,
  ): Promise<CASSupplierResponse> {
    const url = `${this.casIntegrationConfig.baseUrl}/cfs/supplier/${surname}/lastname/${sin}/sin`;
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
