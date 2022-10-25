import { Controller, Patch } from "@nestjs/common";
import { ApplicationService } from "../../services";
import { AllowAuthorizedParty, UserToken } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ClientTypeBaseRoute } from "../../types";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { IUserToken } from "../../auth/userToken.interface";

/**
 * Allow system access to the application data.
 * System access will give the ability to request access from any
 * student data. This is required for external systems (e.g. workflow)
 * to process and have access to all data as needed.
 */
@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("application")
@ApiTags(`${ClientTypeBaseRoute.SystemAccess}-application`)
export class ApplicationSystemAccessController extends BaseController {
  constructor(private readonly applicationService: ApplicationService) {
    super();
  }

  /**
   * Archives one or more applications when 43 days
   * have passed the end of the study period.
   */
  @Patch("archive")
  async archiveApplications(@UserToken() userToken: IUserToken): Promise<void> {
    await this.applicationService.archiveApplications(userToken.userId);
  }
}
