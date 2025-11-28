import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../../auth/decorators/public.decorator";
import { ConfigService } from "@sims/utilities/config";
import BaseController from "../BaseController";
import { ConfigAPIOutDTO } from "./models/config.dto";
import { BULL_BOARD_ROUTE } from "@sims/services/constants";
import { AllowDuringMaintenanceMode } from "apps/api/src/auth/decorators/allow-during-maintenance-mode";

@AllowDuringMaintenanceMode()
@Controller("config")
@ApiTags("config")
export class ConfigController extends BaseController {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  /**
   * Gets the application configuration.
   * @returns configuration for the application.
   */
  @Public()
  @Get()
  getConfig(): ConfigAPIOutDTO {
    const authConfig = this.configService.auth;
    return {
      auth: {
        url: authConfig.url,
        realm: authConfig.realm,
        clientIds: authConfig.clientIds,
        externalSiteMinderLogoutUrl: authConfig.externalSiteMinderLogoutUrl,
      },
      version: this.configService.apiVersion,
      isFulltimeAllowed: this.configService.isFulltimeAllowed,
      allowBetaInstitutionsOnly: this.configService.allowBetaInstitutionsOnly,
      maximumIdleTimeForWarningStudent:
        this.configService.maximumIdleTimeForWarningStudent,
      maximumIdleTimeForWarningSupportingUser:
        this.configService.maximumIdleTimeForWarningSupportingUser,
      maximumIdleTimeForWarningInstitution:
        this.configService.maximumIdleTimeForWarningInstitution,
      maximumIdleTimeForWarningAEST:
        this.configService.maximumIdleTimeForWarningAEST,
      applicationSubmissionDeadlineWeeks:
        this.configService.applicationSubmissionDeadlineWeeks,
      appEnv: this.configService.appEnv,
      queueDashboardURL: `${process.env.QUEUE_DASHBOARD_BASE_URL}/${BULL_BOARD_ROUTE}`,
      maintenanceMode: this.configService.maintenanceMode,
      maintenanceModeStudent: this.configService.maintenanceModeStudent,
      maintenanceModeInstitution: this.configService.maintenanceModeInstitution,
      maintenanceModeMinistry: this.configService.maintenanceModeMinistry,
      maintenanceModeSupportingUser:
        this.configService.maintenanceModeSupportingUser,
      maintenanceModeExternal: this.configService.maintenanceModeExternal,
    };
  }
}
