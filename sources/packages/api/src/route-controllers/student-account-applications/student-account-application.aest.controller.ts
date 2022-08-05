import { Controller, Injectable } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ClientTypeBaseRoute } from "../../types";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import BaseController from "../BaseController";

/**
 * Student account applications when the authentication happens through BCeID
 * and the Ministry needs to confirm the student identity.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("student-account-application")
@ApiTags(`${ClientTypeBaseRoute.AEST}-student-account-application`)
@Injectable()
export class StudentAccountApplicationAESTController extends BaseController {
  constructor() {
    super();
  }
}
