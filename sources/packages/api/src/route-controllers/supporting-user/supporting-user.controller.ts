import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Patch,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  ApplicationService,
  FormService,
  SupportingUserService,
  UserService,
  WorkflowActionsService,
} from "../../services";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IUserToken } from "../../auth/userToken.interface";
import { AllowAuthorizedParty } from "../../auth/decorators/authorized-party.decorator";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { UpdateSupportingUserDTO } from "./models/supporting-user.dto";
import { SupportingUserType } from "../../database/entities";
import { AddressInfo, ApiProcessError, ContactInfo } from "../../types";
import { FormNames } from "../../services/form/constants";
import {
  STUDENT_APPLICATION_NOT_FOUND,
  SUPPORTING_USER_ALREADY_PROVIDED_DATA,
  SUPPORTING_USER_TYPE_ALREADY_PROVIDED_DATA,
} from "../../services/supporting-user/constants";

@AllowAuthorizedParty(AuthorizedParties.supportingUsers)
@Controller("supporting-user")
export class SupportingUserController {
  constructor(
    private readonly supportingUserService: SupportingUserService,
    private readonly applicationService: ApplicationService,
    private readonly userService: UserService,
    private readonly formService: FormService,
    private readonly workflowActionsService: WorkflowActionsService,
  ) {}

  /**
   * Updates the supporting data for a particular supporting user
   * where the application is waiting for his input.
   * @param userToken authentication information.
   * @param supportingUserType type of the supporting user providing
   * the supporting data (e.g. parent/partner).
   * @param applicationNumber application number to be searched.
   * @param payload data used for validation and to execute the update.
   */
  @Patch(":supportingUserType")
  async updateSupportingInformation(
    @UserToken() userToken: IUserToken,
    @Param("supportingUserType") supportingUserType: SupportingUserType,
    @Body() payload: UpdateSupportingUserDTO,
  ): Promise<void> {
    // Different types of supporting users need to provide different
    // type of supporting information, what requires different forms
    // and different validations.
    const formName =
      supportingUserType === SupportingUserType.Parent
        ? FormNames.SupportingUsersParent
        : FormNames.SupportingUsersPartner;

    const submissionResult = await this.formService.dryRunSubmission(
      formName,
      payload,
    );

    if (!submissionResult.valid) {
      throw new BadRequestException(
        "Not able to update supporting user data due to an invalid request.",
      );
    }
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
        addressLine1: payload.addressLine1,
        addressLine2: payload.addressLine2,
        province: payload.provinceState,
        country: payload.country,
        city: payload.city,
        postalCode: payload.postalCode,
      };

      const contactInfo: ContactInfo = {
        phone: payload.phone,
        addresses: [addressInfo],
      };

      const updatedUser = await this.supportingUserService.updateSupportingUser(
        application.id,
        supportingUserType,
        {
          contactInfo,
          sin: payload.sin,
          birthDate: new Date(userToken.birthdate),
          gender: userToken.gender,
          supportingData: payload.supportingData,
          userId: user.id,
        },
      );

      await this.workflowActionsService.sendSupportingUsersCompletedMessage(
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
    }
  }
}
