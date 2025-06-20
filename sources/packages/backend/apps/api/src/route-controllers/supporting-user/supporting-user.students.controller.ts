import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
} from "@nestjs/common";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  RequiresStudentAccount,
  UserToken,
} from "../../auth/decorators";
import {
  DynamicFormConfigurationService,
  SupportingUserService,
} from "../../services";
import { ClientTypeBaseRoute } from "../../types";
import { StudentSupportingUserAPIOutDTO } from "./models/supporting-user.dto";
import { StudentUserToken } from "../../auth";
import { DynamicFormType } from "@sims/sims-db";

@AllowAuthorizedParty(AuthorizedParties.student)
@RequiresStudentAccount()
@Controller("supporting-user")
@ApiTags(`${ClientTypeBaseRoute.Student}-supporting-user`)
export class SupportingUserStudentsController {
  constructor(
    private readonly supportingUserService: SupportingUserService,
    private readonly dynamicFormConfigurationService: DynamicFormConfigurationService,
  ) {}

  /**
   * Get supporting user details of the supporting user for whom
   * the student is expected to report the information.
   ** The access of the supporting user details is limited to
   ** supporting user type parent only in addition to the student reporting mentioned above.
   * @param supportingUserId supporting user id.
   * @returns supporting user details with the dynamic form name.
   */
  @Get(":supportingUserId")
  @ApiNotFoundResponse({
    description:
      "Supporting user not found or not eligible to be accessed by the student.",
  })
  async getIdentifiableSupportingUser(
    @Param("supportingUserId", ParseIntPipe) supportingUserId: number,
    @UserToken() studentToken: StudentUserToken,
  ): Promise<StudentSupportingUserAPIOutDTO> {
    const supportingUser =
      await this.supportingUserService.getIdentifiableSupportingUser(
        supportingUserId,
        { isAbleToReport: false, studentId: studentToken.studentId },
      );
    if (!supportingUser) {
      throw new NotFoundException(
        "Supporting user not found or not eligible to be accessed by the student.",
      );
    }
    const formName = this.dynamicFormConfigurationService.getDynamicFormName(
      DynamicFormType.SupportingUsersParent,
      { programYearId: supportingUser.application.programYear.id },
    );
    return {
      fullName: supportingUser.fullName,
      formName,
    };
  }
}
