import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
} from "@nestjs/common";
import {
  DynamicFormConfigurationService,
  SupportingUserService,
} from "../../services";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import {
  ApplicationSupportingUsersAPIOutDTO,
  SupportingUserFormDataAPIOutDTO,
} from "./models/supporting-user.dto";
import { getSupportingUserFormType } from "../../utilities";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import { ClientTypeBaseRoute } from "../../types";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("supporting-user")
@ApiTags(`${ClientTypeBaseRoute.AEST}-supporting-user`)
export class SupportingUserAESTController {
  constructor(
    private readonly supportingUserService: SupportingUserService,
    private readonly dynamicFormConfigurationService: DynamicFormConfigurationService,
  ) {}
  /**
   * Get the list of supporting users respective to
   * an application id for AEST user.
   * @param applicationId application id.
   * @return list of supporting users of an application.
   */
  @Get("application/:applicationId")
  async getSupportingUsersOfAnApplication(
    @Param("applicationId", ParseIntPipe) applicationId: number,
  ): Promise<ApplicationSupportingUsersAPIOutDTO[]> {
    const supportingUserForApplication =
      await this.supportingUserService.getSupportingUsersByApplicationId(
        applicationId,
      );
    return supportingUserForApplication.map((supportingUser) => ({
      supportingUserId: supportingUser.id,
      supportingUserType: supportingUser.supportingUserType,
    }));
  }

  /**
   * Get supporting user formName and the form data
   * with the supportingUserId
   * @param supportingUserId supporting user id.
   * @returns supporting user form data and details.
   */
  @Get(":supportingUserId")
  @ApiNotFoundResponse({
    description:
      "Supporting user details not found or Supporting user has not submitted the form.",
  })
  async getSupportingUserFormDetails(
    @Param("supportingUserId", ParseIntPipe) supportingUserId: number,
  ): Promise<SupportingUserFormDataAPIOutDTO> {
    const supportingUserForApplication =
      await this.supportingUserService.getSupportingUsersDetails(
        supportingUserId,
      );
    if (!supportingUserForApplication) {
      throw new NotFoundException(
        `Supporting user ${supportingUserId} details not found or Supporting user has not submitted the form`,
      );
    }
    const formName = this.dynamicFormConfigurationService.getDynamicFormName(
      getSupportingUserFormType(
        supportingUserForApplication.supportingUserType,
      ),
      supportingUserForApplication.application.programYear.id,
    );
    return {
      formName,
      supportingData: supportingUserForApplication.supportingData,
      contactInfo: supportingUserForApplication.contactInfo,
      sin: supportingUserForApplication.sin,
      birthDate: supportingUserForApplication.birthDate,
      email: supportingUserForApplication.user.email,
      firstName: supportingUserForApplication.user.firstName,
      lastName: supportingUserForApplication.user.lastName,
    };
  }
}
