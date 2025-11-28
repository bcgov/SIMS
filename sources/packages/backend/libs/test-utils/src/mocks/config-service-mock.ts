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

  /**
   * Mock the maintenanceMode config value to allow changing the behavior
   * of the maintenance mode between tests.
   * @param value true to enable maintenance mode.
   */
  setMaintenanceMode(value: {
    maintenanceMode?: boolean;
    maintenanceModeStudent?: boolean;
    maintenanceModeInstitution?: boolean;
    maintenanceModeMinistry?: boolean;
    maintenanceModeSupportingUser?: boolean;
    maintenanceModeExternal?: boolean;
  }): void {
    jest
      .spyOn(this.configService, "maintenanceMode", "get")
      .mockReturnValue(
        value.maintenanceMode ?? this.configService.maintenanceMode,
      );

    jest
      .spyOn(this.configService, "maintenanceModeStudent", "get")
      .mockReturnValue(
        value.maintenanceModeStudent ??
          this.configService.maintenanceModeStudent,
      );

    jest
      .spyOn(this.configService, "maintenanceModeInstitution", "get")
      .mockReturnValue(
        value.maintenanceModeInstitution ??
          this.configService.maintenanceModeInstitution,
      );

    jest
      .spyOn(this.configService, "maintenanceModeMinistry", "get")
      .mockReturnValue(
        value.maintenanceModeMinistry ??
          this.configService.maintenanceModeMinistry,
      );

    jest
      .spyOn(this.configService, "maintenanceModeSupportingUser", "get")
      .mockReturnValue(
        value.maintenanceModeSupportingUser ??
          this.configService.maintenanceModeSupportingUser,
      );

    jest
      .spyOn(this.configService, "maintenanceModeExternal", "get")
      .mockReturnValue(
        value.maintenanceModeExternal ??
          this.configService.maintenanceModeExternal,
      );
  }
}
