import { Injectable } from "@nestjs/common";
import { IConfig } from "..";

/**
 * Workers configurations.
 */
@Injectable()
export class ConfigService {
  /**
   * Environment configurations.
   */
  readonly env: IConfig;

  constructor() {
    this.env = this.getConfig();
  }

  /**
   * Loads all environment variables and parsed them.
   * @returns parsed environment variables.
   */
  private getConfig(): IConfig {
    return {
      bypassCRAIncomeVerification:
        process.env.BYPASS_CRA_INCOME_VERIFICATION === "true",
    };
  }
}
