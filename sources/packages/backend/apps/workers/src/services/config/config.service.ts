import { Injectable } from "@nestjs/common";
import { IConfig } from "..";

@Injectable()
export class ConfigService {
  readonly env: IConfig;

  constructor() {
    this.env = this.getConfig();
  }

  private getConfig(): IConfig {
    return {
      bypassCRAIncomeVerification:
        process.env.BYPASS_CRA_INCOME_VERIFICATION === "true",
    };
  }
}
