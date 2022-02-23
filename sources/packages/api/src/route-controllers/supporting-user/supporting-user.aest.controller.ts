import { Controller, Get, Param } from "@nestjs/common";
import { SupportingUserService } from "../../services";

import { AllowAuthorizedParty } from "../../auth/decorators/authorized-party.decorator";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { Groups } from "src/auth/decorators";
import { UserGroups } from "src/auth/user-groups.enum";
import { ApplicationSupportingUsersDTO } from "./models/supporting-user.dto";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("supporting-user")
export class AESTSupportingUserController {
  constructor(private readonly supportingUserService: SupportingUserService) {}
  /**
   * Get the list of supporting users respective to
   * an application id for AEST user.
   * @param applicationId application id.
   * @return list of supporting users of an
   * application, i.e ApplicationSupportingUsersDTO
   */
  @Get("application/:applicationId/aest")
  async getSupportingUserOfAnApplication(
    @Param("applicationId") applicationId: number,
  ): Promise<ApplicationSupportingUsersDTO[]> {
    const supportingUserForApplication =
      await this.supportingUserService.getSupportingUserByApplicationId(
        applicationId,
      );
    return supportingUserForApplication.map(
      (supportingUser) =>
        ({
          supportingUserId: supportingUser.id,
          supportingUserType: supportingUser.supportingUserType,
        } as ApplicationSupportingUsersDTO),
    );
  }
}
