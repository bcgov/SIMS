import {
  BadRequestException,
  Body,
  Controller,
  Patch,
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
import { UpdateSupportingUserDTO } from "./models/supporting-user.dto";
import { SupportingUserType } from "../../database/entities";
import { AddressInfo, ContactInfo } from "../../types";
import { FormNames } from "src/services/form/constants";

@AllowAuthorizedParty(AuthorizedParties.supportingUsers)
@Controller("students")
export class SupportingUserController {
  constructor(
    private readonly supportingUserService: SupportingUserService,
    private readonly applicationService: ApplicationService,
    private readonly userService: UserService,
    private readonly formService: FormService,
  ) {}

  @Patch()
  async updateSupportingUser(
    @UserToken() userToken: IUserToken,
    @Body() payload: UpdateSupportingUserDTO,
  ): Promise<void> {
    const formName =
      payload.supportingUserType === SupportingUserType.Parent
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

    const userQuery = this.userService.syncUser(
      userToken.userName,
      userToken.email,
      userToken.givenNames,
      userToken.lastName,
    );

    const applicationQuery =
      this.applicationService.getApplicationForSupportingUser(
        payload.applicationNumber,
        payload.studentsGivenNames,
        payload.studentsLastName,
        payload.studentsDateOfBirth,
      );

    const [user, application] = await Promise.all([
      userQuery,
      applicationQuery,
    ]);

    if (!application) {
      throw new UnprocessableEntityException(
        "Not able to find a Student Application to update the supporting data.",
      );
    }

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

    await this.supportingUserService.updateSupportingUser(
      application.id,
      payload.supportingUserType,
      contactInfo,
      payload.sin,
      new Date(userToken.birthdate),
      userToken.gender,
      payload.supportingData,
      user.id,
    );
  }
}
