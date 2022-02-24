import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { ApplicationService, SupportingUserService } from "../../services";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import {
  ApplicationSupportingUsersDTO,
  SupportingUserFormData,
} from "./models/supporting-user.dto";
import { getSupportingUserForm } from "../../utilities";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("supporting-user")
export class AESTSupportingUserController {
  constructor(
    private readonly supportingUserService: SupportingUserService,
    private readonly applicationService: ApplicationService,
  ) {}
  /**
   * Get the list of supporting users respective to
   * an application id for AEST user.
   * @param applicationId application id.
   * @return list of supporting users of an
   * application, i.e ApplicationSupportingUsersDTO
   */
  @Get("application/:applicationId/aest")
  async getSupportingUsersOfAnApplication(
    @Param("applicationId") applicationId: number,
  ): Promise<ApplicationSupportingUsersDTO[]> {
    const supportingUserForApplication =
      await this.supportingUserService.getSupportingUsersByApplicationId(
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

  /**
   * Get supporting user formName and the form data
   * with the supportingUserId
   * @param supportingUserId supporting user id.
   * @param applicationId application id.
   * @returns supporting user form data and details.
   */
  @Get("/:supportingUserId/application/:applicationId/aest")
  async getSupportingUserFormDetails(
    @Param("supportingUserId") supportingUserId: number,
    @Param("applicationId") applicationId: number,
  ): Promise<SupportingUserFormData> {
    const supportingUserForms =
      await this.applicationService.getSupportingUserFormName(applicationId);

    const supportingUserForApplication =
      await this.supportingUserService.getSupportingUserById(
        applicationId,
        supportingUserId,
      );

    if (!supportingUserForApplication) {
      throw new NotFoundException(
        `Supporting user ${supportingUserId} not found.`,
      );
    }
    return {
      formName: getSupportingUserForm(
        supportingUserForApplication.supportingUserType,
        supportingUserForms.programYear,
      ),
      formData: supportingUserForApplication.supportingData,
    };
  }
}
