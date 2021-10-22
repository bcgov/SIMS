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
  EducationProgramOfferingService,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
  SupportingUserService,
} from "../../services";
import { ApplicationDataDto } from "./models/application.model";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  UpdateProgramInfoDto,
  UpdateProgramInfoStatusDto,
  UpdateAssessmentStatusDto,
  UpdateCOEStatusDto,
  UpdateApplicationStatusDto,
  UpdateApplicationStatusWorkflowIdDto,
  SupportingUserDto,
  CreateSupportingUsersDto,
  CreateIncomeVerificationDto,
  CRAVerificationIncomeDetailsDto,
} from "./models/application.system.model";
import { IConfig } from "../../types";

/**
 * Allow system access to the application data.
 * System access will give the ability to request access from any
 * student data. This is required for external systems (e.g. workflow)
 * to process and have access to all data as needed.
 */
@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("system-access/application")
export class ApplicationSystemController {
  private readonly config: IConfig;
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly offeringService: EducationProgramOfferingService,
    private readonly incomeVerificationService: CRAIncomeVerificationService,
    private readonly supportingUserService: SupportingUserService,
    private readonly configService: ConfigService,
  ) {
    this.config = this.configService.getConfig();
  }

  @Get(":id")
  async getByApplicationId(
    @Param("id") applicationId: number,
  ): Promise<ApplicationDataDto> {
    const application = await this.applicationService.getApplicationById(
      applicationId,
    );
    if (!application) {
      throw new NotFoundException(
        `Application id ${applicationId} was not found.`,
      );
    }

    return {
      data: application.data,
      // Kept for backward compatibility. To be removed in upcoming PR.
      programYear: application.programYear.programYear,
      programYearDetail: {
        programYear: application.programYear.programYear,
        startDate: application.programYear.startDate,
        endDate: application.programYear.endDate,
      },
      offering: {
        id: application.offering?.id,
        studyStartDate: application.offering?.studyStartDate,
        studyEndDate: application.offering?.studyEndDate,
        breakStartDate: application.offering?.breakStartDate,
        breakEndDate: application.offering?.breakEndDate,
        actualTuitionCosts: application.offering?.actualTuitionCosts,
        programRelatedCosts: application.offering?.programRelatedCosts,
        mandatoryFees: application.offering?.mandatoryFees,
        exceptionalExpenses: application.offering?.exceptionalExpenses,
        tuitionRemittanceRequestedAmount:
          application.offering?.tuitionRemittanceRequestedAmount,
        offeringDelivered: application.offering?.offeringDelivered,
        offeringIntensity: application.offering?.offeringIntensity,
      },
      program: {
        programCredentialType:
          application.offering?.educationProgram?.credentialType,
        programLength: application.offering?.educationProgram?.completionYears,
      },
      institution: {
        institutionType:
          application.location?.institution?.institutionType?.name,
      },
      location: {
        institutionLocationProvince:
          application.location?.data?.address?.province,
      },
      student: {
        studentPDStatus: application.student.studentPDVerified,
      },
    };
  }

  @Patch(":applicationId/assessment")
  async updateAssessmentInApplication(
    @Body() assessment: any,
    @Param("applicationId") applicationId: number,
  ): Promise<number> {
    const updateAssessmentInApplication =
      await this.applicationService.updateAssessmentInApplication(
        applicationId,
        assessment,
      );

    return updateAssessmentInApplication.affected;
  }

  /**
   * Updates Program Information Request (PIR) related data.
   * @param applicationId application id to be updated.
   * @param payload data to be updated.
   * @returns success HTTP 200 status code if PIR was updated
   * or a HTTP 422 error in case of failure to update it.
   */
  @Patch(":id/program-info")
  async updateProgramInfoRequest(
    @Param("id") applicationId: number,
    @Body() payload: UpdateProgramInfoDto,
  ): Promise<void> {
    if (payload.offeringId) {
      const offering = await this.offeringService.getProgramOffering(
        payload.locationId,
        payload.programId,
        payload.offeringId,
      );
      if (!offering) {
        throw new UnprocessableEntityException(
          "Not able to find the offering associate with the program and location.",
        );
      }
    }

    const updateResult = await this.applicationService.updateProgramInfo(
      applicationId,
      payload.locationId,
      payload.status,
      payload.programId,
      payload.offeringId,
    );

    // Checks if some record was updated.
    // If affected is zero it means that the update was not successful.
    if (updateResult.affected === 0) {
      throw new NotFoundException(
        "Not able to update the program information request with provided data.",
      );
    }
  }

  /**
   * Updates Program Information Request (PRI) status.
   * @param applicationId application id to be updated.
   * @param payload status of the program information request.
   */
  @Patch(":id/program-info/status")
  async updateProgramInfoRequestStatus(
    @Param("id") applicationId: number,
    @Body() payload: UpdateProgramInfoStatusDto,
  ): Promise<void> {
    const updateResult = await this.applicationService.updateProgramInfoStatus(
      applicationId,
      payload.status,
    );

    // Checks if some record was updated.
    // If affected is zero it means that the update was not successful.
    if (updateResult.affected === 0) {
      throw new UnprocessableEntityException(
        "Not able to update the program information request status with provided data.",
      );
    }
  }

  /**
   * Updates overall Application status and Assessment workflowId.
   * @param applicationId application id to be updated.
   * @param payload contains the application status and the workflowId.
   */
  @Patch(":id/application-status-workflowId")
  async updateApplicationStatusWorkflowId(
    @Param("id") applicationId: number,
    @Body() payload: UpdateApplicationStatusWorkflowIdDto,
  ): Promise<void> {
    const updateResult =
      await this.applicationService.updateApplicationStatusWorkflowId(
        applicationId,
        payload.status,
        payload.workflowId,
      );

    // Checks if some record was updated.
    // If affected is zero it means that the update was not successful.
    if (updateResult.affected === 0) {
      throw new UnprocessableEntityException(
        "Not able to update the overall Application status and workflowId with provided data.",
      );
    }
  }

  /**
   * Updates Assessment status.
   * @param applicationId application id to be updated.
   * @param payload status of the program information request.
   */
  @Patch(":id/assessment/status")
  async updateAssessmentStatus(
    @Param("id") applicationId: number,
    @Body() payload: UpdateAssessmentStatusDto,
  ): Promise<void> {
    const updateResult = await this.applicationService.updateAssessmentStatus(
      applicationId,
      payload.status,
    );

    // Checks if some record was updated.
    // If affected is zero it means that the update was not successful.
    if (updateResult.affected === 0) {
      throw new UnprocessableEntityException(
        "Not able to update the assessment status with provided data.",
      );
    }
  }

  /**
   * Updates Confirmation of Enrollment(COE) status.
   * @param applicationId application id to be updated.
   * @param payload status of the program information request.
   */
  @Patch(":id/coe/status")
  async updateCOEStatus(
    @Param("id") applicationId: number,
    @Body() payload: UpdateCOEStatusDto,
  ): Promise<void> {
    const updateResult = await this.applicationService.updateCOEStatus(
      applicationId,
      payload.status,
    );

    // Checks if some record was updated.
    // If affected is zero it means that the update was not successful.
    if (updateResult.affected === 0) {
      throw new UnprocessableEntityException(
        "Not able to update the Confirmation of Enrollment status with provided data.",
      );
    }
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
   * existing one instead.
   * @param applicationId application id to receive an MSFAA.
   */
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
}
