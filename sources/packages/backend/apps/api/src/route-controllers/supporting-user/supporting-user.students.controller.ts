import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import {
  ApplicationEditStatus,
  ApplicationStatus,
  DynamicFormType,
  SupportingUserType,
} from "@sims/sims-db";
import { StudentUserToken } from "../../auth";
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
import {
  ReportedSupportingUserAPIInDTO,
  ReportedSupportingUserAPIOutDTO,
  SupportingUserControllerService,
} from "..";
import { WorkflowClientService } from "@sims/services";

@AllowAuthorizedParty(AuthorizedParties.student)
@RequiresStudentAccount()
@Controller("supporting-user")
@ApiTags(`${ClientTypeBaseRoute.Student}-supporting-user`)
export class SupportingUserStudentsController {
  constructor(
    private readonly supportingUserService: SupportingUserService,
    private readonly dynamicFormConfigurationService: DynamicFormConfigurationService,
    private readonly supportingUserControllerService: SupportingUserControllerService,
    private readonly workflowClientService: WorkflowClientService,
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
  ): Promise<ReportedSupportingUserAPIOutDTO> {
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
      supportingUser.supportingUserType === SupportingUserType.Parent
        ? DynamicFormType.SupportingUsersParent
        : DynamicFormType.SupportingUsersPartner,
      { programYearId: supportingUser.application.programYear.id },
    );
    return {
      fullName: supportingUser.fullName,
      formName,
      isAbleToReport: supportingUser.isAbleToReport,
      programYearStartDate: supportingUser.application.programYear.startDate,
      supportingUserType: supportingUser.supportingUserType,
    };
  }

  /**
   * Submit supporting user student reported data.
   * @param supportingUserId supporting user id.
   * @param payload payload with supporting user student reported data.
   */
  @Patch(":supportingUserId")
  @ApiNotFoundResponse({
    description:
      "Supporting user not found or not eligible to be accessed by the user.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "Supporting data has already been submitted for this supporting user" +
      " or Application is not expecting any supporting data to be submitted at the current status" +
      " or Dynamic form configuration not found.",
  })
  @ApiBadRequestResponse({
    description:
      "Not able to update supporting user data due to an invalid request.",
  })
  async submitSupportingUserDetails(
    @Param("supportingUserId", ParseIntPipe) supportingUserId: number,
    @Body() payload: ReportedSupportingUserAPIInDTO,
    @UserToken() studentToken: StudentUserToken,
  ): Promise<void> {
    const supportingUser =
      await this.supportingUserService.getIdentifiableSupportingUser(
        supportingUserId,
        {
          isAbleToReport: false,
          studentId: studentToken.studentId,
          loadSupportingData: true,
        },
      );
    if (!supportingUser) {
      throw new NotFoundException(
        "Supporting user not found or not eligible to be accessed by the user.",
      );
    }
    // If the supporting data has already been submitted, throw an error.
    if (supportingUser.supportingData) {
      throw new UnprocessableEntityException(
        "Supporting data has already been submitted for this supporting user.",
      );
    }
    // Validate application status before submitting supporting data.
    const isValidToSubmitSupportingData =
      supportingUser.application.applicationStatus ===
        ApplicationStatus.InProgress ||
      supportingUser.application.applicationEditStatus ===
        ApplicationEditStatus.ChangeInProgress;
    if (!isValidToSubmitSupportingData) {
      throw new UnprocessableEntityException(
        "Application is not expecting any supporting data to be submitted at the current status.",
      );
    }
    const validatedData =
      await this.supportingUserControllerService.validateDryRunSubmission(
        supportingUser.application.programYear.id,
        supportingUser.supportingUserType,
        { ...payload, isAbleToReport: supportingUser.isAbleToReport },
      );
    // Update supporting user reported data.
    await this.supportingUserService.updateReportedData(
      supportingUserId,
      validatedData,
      studentToken.userId,
    );
    // Send message to workflow to allow it to proceed.
    await this.workflowClientService.sendSupportingUsersCompletedMessage(
      supportingUserId,
    );
  }
}
