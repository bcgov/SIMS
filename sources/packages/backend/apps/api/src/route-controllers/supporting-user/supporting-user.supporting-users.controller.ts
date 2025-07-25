import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  DynamicFormConfigurationService,
  SupportingUserService,
  UserService,
} from "../../services";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IUserToken } from "../../auth/userToken.interface";
import { AllowAuthorizedParty } from "../../auth/decorators/authorized-party.decorator";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  ApplicationIdentifierAPIInDTO,
  ApplicationAPIOutDTO,
  UpdateSupportingUserAPIInDTO,
} from "./models/supporting-user.dto";
import { AddressInfo, ContactInfo } from "@sims/sims-db";
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";
import {
  STUDENT_APPLICATION_NOT_FOUND,
  SUPPORTING_USER_ALREADY_PROVIDED_DATA,
  SUPPORTING_USER_IS_THE_STUDENT_FROM_APPLICATION,
} from "../../services/supporting-user/constants";
import { getSupportingUserFormType } from "../../utilities";
import {
  ApiBadRequestResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import BaseController from "../BaseController";
import { WorkflowClientService } from "@sims/services";
import { RequiresUserAccount } from "../../auth/decorators";
import { SupportingUserControllerService } from "./supporting-user.controller.service";

@AllowAuthorizedParty(AuthorizedParties.supportingUsers)
@Controller("supporting-user")
@ApiTags(`${ClientTypeBaseRoute.SupportingUser}-supporting-user`)
export class SupportingUserSupportingUsersController extends BaseController {
  constructor(
    private readonly supportingUserService: SupportingUserService,
    private readonly userService: UserService,
    private readonly workflowClientService: WorkflowClientService,
    private readonly dynamicFormConfigurationService: DynamicFormConfigurationService,
    private readonly supportingUserControllerService: SupportingUserControllerService,
  ) {
    super();
  }

  /**
   * Gets supporting user application related information.
   * !Here the post method is used to avoid sending the
   * !student data exposed in the URL. The method return a
   * !200 status to reinforce that nothing was created.
   * @param payload payload that identifies the Student
   * Application.
   * @returns application details.
   */
  @RequiresUserAccount(false)
  @Post("application")
  @HttpCode(HttpStatus.OK)
  @ApiUnprocessableEntityResponse({
    description:
      "Not able to find a Student Application with the requested data " +
      "or the user searching for applications to provide data must be " +
      "different from the user associated with the student application or " +
      "dynamic form configuration not found.",
  })
  async getApplicationDetails(
    @UserToken() userToken: IUserToken,
    @Body() payload: ApplicationIdentifierAPIInDTO,
  ): Promise<ApplicationAPIOutDTO> {
    const supportingUser =
      await this.supportingUserService.getSupportingUserForApplication(
        payload.supportingUserType,
        payload.applicationNumber,
        payload.studentsLastName,
        {
          fullName: payload.fullName,
          studentsDateOfBirth: payload.studentsDateOfBirth,
        },
      );

    if (!supportingUser) {
      throw new UnprocessableEntityException(
        new ApiProcessError(
          "Not able to find a Student Application with the provided data.",
          STUDENT_APPLICATION_NOT_FOUND,
        ),
      );
    }

    // Ensure that the user providing the supporting data is not the same user that
    // submitted the Student Application.
    if (
      supportingUser.application.student.user.userName === userToken.userName
    ) {
      throw new UnprocessableEntityException(
        new ApiProcessError(
          "The user searching for applications to provide data " +
            "must be different from the user associated with the student application.",
          SUPPORTING_USER_IS_THE_STUDENT_FROM_APPLICATION,
        ),
      );
    }
    const formType = getSupportingUserFormType(payload.supportingUserType);
    const formName = this.dynamicFormConfigurationService.getDynamicFormName(
      formType,
      { programYearId: supportingUser.application.programYear.id },
    );
    if (!formName) {
      throw new UnprocessableEntityException(
        `Dynamic form configuration for ${formType} not found.`,
      );
    }
    return {
      programYearStartDate: supportingUser.application.programYear.startDate,
      formName,
      offeringIntensity: supportingUser.application.offeringIntensity,
    };
  }

  /**
   * Updates the supporting data for a particular supporting user
   * where the application is waiting for his input.
   * @param userToken authentication information.
   * the supporting data (e.g. parent/partner).
   * @param payload data used for validation and to execute the update.
   */
  @RequiresUserAccount(false)
  @Patch()
  @ApiUnprocessableEntityResponse({
    description:
      "Invalid offering intensity or " +
      "student application not found to update the supporting data or " +
      "the user currently authenticated is the same user that submitted " +
      "the application or supporting user already submitted the information or " +
      "dynamic form configuration not found.",
  })
  @ApiBadRequestResponse({ description: "Invalid request." })
  async updateSupportingInformation(
    @UserToken() userToken: IUserToken,
    @Body() payload: UpdateSupportingUserAPIInDTO,
  ): Promise<void> {
    // Regardless of the API call is successful or not, create/update
    // the user being used to execute the request.
    const userQuery = this.userService.syncUser(
      userToken.userName,
      userToken.email,
      userToken.givenNames,
      userToken.lastName,
    );
    // Use the provided data to search for the Student Application.
    // The application must be search using at least 3 criteria as
    // per defined by the Ministry policies.
    const supportingUserQuery =
      this.supportingUserService.getSupportingUserForApplication(
        payload.supportingUserType,
        payload.applicationNumber,
        payload.studentsLastName,
        {
          fullName: payload.fullName,
          studentsDateOfBirth: payload.studentsDateOfBirth,
        },
      );

    // Wait for both queries to finish.
    const [user, supportingUser] = await Promise.all([
      userQuery,
      supportingUserQuery,
    ]);

    if (!supportingUser) {
      throw new UnprocessableEntityException(
        new ApiProcessError(
          "Not able to find a Student Application to update the supporting data.",
          STUDENT_APPLICATION_NOT_FOUND,
        ),
      );
    }
    // Ensure the offering intensity provided is the same from the application.
    if (
      payload.offeringIntensity !== supportingUser.application.offeringIntensity
    ) {
      throw new UnprocessableEntityException("Invalid offering intensity.");
    }
    // If the supporting data has already been submitted, throw an error.
    if (supportingUser.supportingData) {
      throw new UnprocessableEntityException(
        new ApiProcessError(
          "Supporting data has already been submitted for this supporting user.",
          SUPPORTING_USER_ALREADY_PROVIDED_DATA,
        ),
      );
    }
    const submissionData = { ...payload, isAbleToReport: true };
    const submissionResult =
      await this.supportingUserControllerService.validateDryRunSubmission(
        supportingUser.application.programYear.id,
        payload.supportingUserType,
        submissionData,
      );
    // Ensure that the user providing the supporting data is not the same user that
    // submitted the Student Application.
    if (
      supportingUser.application.student.user.userName === userToken.userName
    ) {
      throw new UnprocessableEntityException(
        new ApiProcessError(
          "The user currently authenticated is the same user that submitted the application.",
          SUPPORTING_USER_IS_THE_STUDENT_FROM_APPLICATION,
        ),
      );
    }

    // Check if the same user is trying to provide data to the same application
    // that he already provided.
    const supportingUserForApplication =
      await this.supportingUserService.getSupportingUserByUserId(
        supportingUser.application.id,
        user.id,
      );

    if (supportingUserForApplication) {
      throw new UnprocessableEntityException(
        new ApiProcessError(
          "Supporting data already provided by this user to the Student Application.",
          SUPPORTING_USER_ALREADY_PROVIDED_DATA,
        ),
      );
    }

    const addressInfo: AddressInfo = {
      addressLine1: submissionResult.addressLine1,
      addressLine2: submissionResult.addressLine2,
      provinceState: submissionResult.provinceState,
      country: submissionResult.country,
      city: submissionResult.city,
      postalCode: submissionResult.postalCode,
    };

    const contactInfo: ContactInfo = {
      phone: submissionResult.phone,
      address: addressInfo,
    };

    const updateResult =
      await this.supportingUserService.updateSupportingUserReportedData(
        supportingUser.id,
        user.id,
        {
          contactInfo,
          sin: submissionResult.sin,
          hasValidSIN: submissionResult.hasValidSIN,
          birthDate: userToken.birthdate,
          supportingData: submissionResult.supportingData,
          userId: user.id,
        },
      );

    if (updateResult.affected !== 1) {
      throw new UnprocessableEntityException(
        `Error while updating the supporting user details for ${supportingUser.id}. Number of affected rows was ${updateResult.affected}, expected 1.`,
      );
    }
    // Send the message to the workflow to complete the supporting user process.
    await this.workflowClientService.sendSupportingUsersCompletedMessage(
      supportingUser.id,
    );
  }
}
