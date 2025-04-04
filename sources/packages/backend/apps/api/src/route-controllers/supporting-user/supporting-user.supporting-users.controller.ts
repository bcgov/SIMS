import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  ApplicationService,
  FormService,
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
import { AddressInfo, ContactInfo, SupportingUserType } from "@sims/sims-db";
import {
  ApiProcessError,
  ClientTypeBaseRoute,
  DryRunSubmissionResult,
} from "../../types";
import {
  STUDENT_APPLICATION_NOT_FOUND,
  SUPPORTING_USER_ALREADY_PROVIDED_DATA,
  SUPPORTING_USER_IS_THE_STUDENT_FROM_APPLICATION,
  SUPPORTING_USER_TYPE_ALREADY_PROVIDED_DATA,
} from "../../services/supporting-user/constants";
import { getSupportingUserForm } from "../../utilities";
import {
  ApiBadRequestResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import BaseController from "../BaseController";
import { WorkflowClientService } from "@sims/services";
import { RequiresUserAccount } from "../../auth/decorators";

@AllowAuthorizedParty(AuthorizedParties.supportingUsers)
@Controller("supporting-user")
@ApiTags(`${ClientTypeBaseRoute.SupportingUser}-supporting-user`)
export class SupportingUserSupportingUsersController extends BaseController {
  constructor(
    private readonly supportingUserService: SupportingUserService,
    private readonly applicationService: ApplicationService,
    private readonly userService: UserService,
    private readonly formService: FormService,
    private readonly workflowClientService: WorkflowClientService,
  ) {
    super();
  }

  /**
   * Gets supporting user application related information.
   * !Here the post method is used to avoid sending the
   * !student data exposed in the URL. The method return a
   * !200 status to reinforce that nothing was created.
   * @param supportingUserType supporting user type.
   * @param payload payload that identifies the Student
   * Application.
   * @returns application details.
   */
  @RequiresUserAccount(false)
  @Post(":supportingUserType/application")
  @HttpCode(HttpStatus.OK)
  @ApiUnprocessableEntityResponse({
    description:
      "Not able to find a Student Application with the requested data " +
      "or the user searching for applications to provide data must be " +
      "different from the user associated with the student application.",
  })
  async getApplicationDetails(
    @UserToken() userToken: IUserToken,
    @Param("supportingUserType", new ParseEnumPipe(SupportingUserType))
    supportingUserType: SupportingUserType,
    @Body() payload: ApplicationIdentifierAPIInDTO,
  ): Promise<ApplicationAPIOutDTO> {
    const application =
      await this.applicationService.getApplicationForSupportingUser(
        payload.applicationNumber,
        payload.studentsLastName,
        payload.studentsDateOfBirth,
      );

    if (!application) {
      throw new UnprocessableEntityException(
        new ApiProcessError(
          "Not able to find a Student Application with the provided data.",
          STUDENT_APPLICATION_NOT_FOUND,
        ),
      );
    }

    // Ensure that the user providing the supporting data is not the same user that
    // submitted the Student Application.
    if (application.student.user.userName === userToken.userName) {
      throw new UnprocessableEntityException(
        new ApiProcessError(
          "The user searching for applications to provide data " +
            "must be different from the user associated with the student application.",
          SUPPORTING_USER_IS_THE_STUDENT_FROM_APPLICATION,
        ),
      );
    }

    return {
      programYearStartDate: application.programYear.startDate,
      formName: getSupportingUserForm(
        supportingUserType,
        application.programYear,
      ),
      offeringIntensity: application.offeringIntensity,
    };
  }

  /**
   * Updates the supporting data for a particular supporting user
   * where the application is waiting for his input.
   * @param userToken authentication information.
   * @param supportingUserType type of the supporting user providing
   * the supporting data (e.g. parent/partner).
   * @param payload data used for validation and to execute the update.
   */
  @RequiresUserAccount(false)
  @Patch(":supportingUserType")
  @ApiUnprocessableEntityResponse({
    description:
      "Invalid offering intensity or " +
      "student application not found to update the supporting data or " +
      "the user currently authenticated is the same user that submitted " +
      "the application or supporting user already submitted the information.",
  })
  @ApiBadRequestResponse({ description: "Invalid request." })
  async updateSupportingInformation(
    @UserToken() userToken: IUserToken,
    @Param("supportingUserType", new ParseEnumPipe(SupportingUserType))
    supportingUserType: SupportingUserType,
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
    const applicationQuery =
      this.applicationService.getApplicationForSupportingUser(
        payload.applicationNumber,
        payload.studentsLastName,
        payload.studentsDateOfBirth,
      );

    // Wait for both queries to finish.
    const [user, application] = await Promise.all([
      userQuery,
      applicationQuery,
    ]);

    if (!application) {
      throw new UnprocessableEntityException(
        new ApiProcessError(
          "Not able to find a Student Application to update the supporting data.",
          STUDENT_APPLICATION_NOT_FOUND,
        ),
      );
    }

    const formName = getSupportingUserForm(
      supportingUserType,
      application.programYear,
    );
    // Ensure the offering intensity provided is the same from the application.
    if (
      payload.offeringIntensity !==
      application.currentAssessment.offering.offeringIntensity
    ) {
      throw new UnprocessableEntityException("Invalid offering intensity.");
    }
    const submissionResult: DryRunSubmissionResult =
      await this.formService.dryRunSubmission(formName, payload);

    if (!submissionResult.valid) {
      throw new BadRequestException(
        "Not able to update supporting user data due to an invalid request.",
      );
    }

    // Ensure that the user providing the supporting data is not the same user that
    // submitted the Student Application.
    if (application.student.user.userName === userToken.userName) {
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
        application.id,
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

    try {
      const addressInfo: AddressInfo = {
        addressLine1: submissionResult.data.data.addressLine1,
        addressLine2: submissionResult.data.data.addressLine2,
        provinceState: submissionResult.data.data.provinceState,
        country: submissionResult.data.data.country,
        city: submissionResult.data.data.city,
        postalCode: submissionResult.data.data.postalCode,
      };

      const contactInfo: ContactInfo = {
        phone: submissionResult.data.data.phone,
        address: addressInfo,
      };

      const updatedUser = await this.supportingUserService.updateSupportingUser(
        application.id,
        supportingUserType,
        user.id,
        {
          contactInfo,
          sin: submissionResult.data.data.sin,
          birthDate: userToken.birthdate,
          supportingData: submissionResult.data.data.supportingData,
          userId: user.id,
        },
      );

      await this.workflowClientService.sendSupportingUsersCompletedMessage(
        updatedUser.id,
      );
    } catch (error) {
      if (error.name === SUPPORTING_USER_TYPE_ALREADY_PROVIDED_DATA) {
        throw new UnprocessableEntityException(
          new ApiProcessError(
            error.message,
            SUPPORTING_USER_TYPE_ALREADY_PROVIDED_DATA,
          ),
        );
      }
      throw error;
    }
  }
}
