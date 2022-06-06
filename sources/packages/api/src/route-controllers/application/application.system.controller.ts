import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  ApplicationService,
  APPLICATION_NOT_FOUND,
  ConfigService,
  CRAIncomeVerificationService,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
  SupportingUserService,
} from "../../services";
import { AllowAuthorizedParty, UserToken } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  UpdateApplicationStatusDto,
  SupportingUserDto,
  CreateSupportingUsersDto,
  CreateIncomeVerificationDto,
  CRAVerificationIncomeDetailsDto,
} from "./models/application.system.model";
import { IConfig } from "../../types";
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import BaseController from "../BaseController";
import { IUserToken } from "../../auth/userToken.interface";

/**
 * Allow system access to the application data.
 * System access will give the ability to request access from any
 * student data. This is required for external systems (e.g. workflow)
 * to process and have access to all data as needed.
 */
@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("system-access/application")
@ApiTags("system-access")
export class ApplicationSystemController extends BaseController {
  private readonly config: IConfig;
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly incomeVerificationService: CRAIncomeVerificationService,
    private readonly supportingUserService: SupportingUserService,
    private readonly configService: ConfigService,
  ) {
    super();
    this.config = this.configService.getConfig();
  }

  /**
   * Updates overall Application status.
   * @param applicationId application id to be updated.
   * @param payload status of the program information request.
   */
  @Patch(":id/application/status")
  async updateApplicationStatus(
    @Param("id") applicationId: number,
    @Body() payload: UpdateApplicationStatusDto,
  ): Promise<void> {
    const updateResult = await this.applicationService.updateApplicationStatus(
      applicationId,
      payload.status,
    );

    // Checks if some record was updated.
    // If affected is zero it means that the update was not successful.
    if (updateResult.affected === 0) {
      throw new UnprocessableEntityException(
        "Not able to update the overall Application status with provided data.",
      );
    }
  }

  /**
   * Associates an MSFAA number to the application checking
   * whatever is needed to create a new MSFAA or use an
   * existing one instead. The MSFAA are individually associated
   * considering the offering intensity full-time/part-time.
   * @param applicationId application id to receive an MSFAA.
   */
  @ApiOkResponse({
    description: "The application was successfully associated with an MSFAA.",
  })
  @ApiNotFoundResponse({
    description:
      "Student Application is not in the expected status. Applications status must the 'assessment' in order to have an MSFAA associated.",
  })
  @ApiUnprocessableEntityResponse({})
  @Patch(":applicationId/msfaa-number")
  async associateMSFAANumber(
    @Param("applicationId") applicationId: number,
  ): Promise<void> {
    try {
      await this.applicationService.associateMSFAANumber(applicationId);
    } catch (error) {
      switch (error.name) {
        case APPLICATION_NOT_FOUND:
          throw new NotFoundException(error.message);
        case INVALID_OPERATION_IN_THE_CURRENT_STATUS:
          throw new UnprocessableEntityException(error.message);
        default:
          throw error;
      }
    }
  }

  /**
   * Creates a CRA Income Verification record that will be waiting
   * to be send to CRA and receive a response.
   * @param payload information needed to create the CRA Income Verification record.
   * @returns the id of the new CRA Verification record created.
   */
  @Post(":applicationId/income-verification")
  async createIncomeVerification(
    @Param("applicationId") applicationId: number,
    @Body() payload: CreateIncomeVerificationDto,
  ): Promise<number> {
    const incomeVerification =
      await this.incomeVerificationService.createIncomeVerification(
        applicationId,
        payload.taxYear,
        payload.reportedIncome,
        payload.supportingUserId,
      );

    if (this.config.bypassCRAIncomeVerification) {
      // Call the async method but do not block the response allowing the API
      // to return the value to the workflow and send the message to bypass
      // the CRA verification.
      this.incomeVerificationService.checkForCRAIncomeVerificationBypass(
        incomeVerification.id,
      );
    }

    return incomeVerification.id;
  }

  /**
   * Gets the CRA income verification associated with the application.
   * The records could be related to a student income or some other
   * supporting user (e.g. parent/partner).
   * @param applicationId application id to retrieve the student income.
   * @param incomeVerificationId income verification associated with
   * the application.
   * @returns student income verification for application.
   */
  @Get(":applicationId/income-verification/:incomeVerificationId")
  async getIncomeVerification(
    @Param("applicationId") applicationId: number,
    @Param("incomeVerificationId") incomeVerificationId: number,
  ): Promise<CRAVerificationIncomeDetailsDto> {
    const income =
      await this.incomeVerificationService.getIncomeVerificationForApplication(
        applicationId,
        incomeVerificationId,
      );

    if (!income) {
      throw new NotFoundException(
        `Income verification id ${incomeVerificationId} not found for application id ${applicationId}.`,
      );
    }

    return {
      reported: income.reportedIncome,
      craReported: income.craReportedIncome,
      verifiedOnCRA: !!income.dateReceived,
    };
  }

  /**
   * Creates a new supporting user with minimal information
   * required to allow the supporting users (e.g. parent/partner)
   * to populate the remaining columns later.
   * @param applicationId application id that requires supporting
   * information.
   * @param payload type of the user that need provide
   * the supporting information for a particular application.
   * @returns id of the newly created supporting user.
   */
  @Post(":applicationId/supporting-user")
  async createSupportingUser(
    @Param("applicationId") applicationId: number,
    @Body() payload: CreateSupportingUsersDto,
  ): Promise<number> {
    const createdUser = await this.supportingUserService.createSupportingUser(
      applicationId,
      payload.supportingUserType,
    );
    return createdUser.id;
  }

  /**
   * Gets a supporting user (e.g. parent/partner) associated
   * with a Student Application.
   * @param applicationId application id that contains the
   * supporting user.
   * @param supportingUserId supporting user from the
   * Student Application.
   * @returns supporting user or an HTTP not found exception.
   */
  @Get(":applicationId/supporting-user/:supportingUserId")
  async getSupportingUser(
    @Param("applicationId") applicationId: number,
    @Param("supportingUserId") supportingUserId: number,
  ): Promise<SupportingUserDto> {
    const supportingUser =
      await this.supportingUserService.getSupportingUserById(
        applicationId,
        supportingUserId,
      );

    if (!supportingUser) {
      throw new NotFoundException(
        `Not able to find the supporting user id ${supportingUserId} for application id ${applicationId}.`,
      );
    }

    return { supportingData: supportingUser.supportingData };
  }

  /**
   * Archives one or more applications when 43 days
   * have passed the end of the study period.
   */
  @Patch("archive")
  async archiveApplications(@UserToken() userToken: IUserToken): Promise<void> {
    await this.applicationService.archiveApplications(userToken.userId);
  }
}
