import { INestApplication } from "@nestjs/common";
import { ConfigService } from "@sims/utilities/config";

/**
 * Helper class to mock ConfigService values for testing purposes.
 */
export class ConfigServiceMockHelper {
  private readonly configService: ConfigService;
  constructor(nestApplication: INestApplication) {
    this.configService = nestApplication.get<ConfigService>(ConfigService);
  }

  /**
   * Mock the allowBetaUsersOnly config value to allow changing the behavior
   * of the beta users authorization between tests.
   * @param allow true to allow beta users only, false to allow all users.
   */
  allowBetaUsersOnly(allow: boolean): void {
    jest
      .spyOn(this.configService, "allowBetaUsersOnly", "get")
      .mockReturnValue(allow);
  }

  /**
   * Mock the bypassMSFAASigning config value to allow changing the behavior
   * of the MSFAA signing process between tests.
   * @param bypass true to bypass MSFAA signing.
   */
  bypassMSFAASigning(bypass: boolean): void {
    jest
      .spyOn(this.configService, "bypassMSFAASigning", "get")
      .mockReturnValue(bypass);
  }
}
