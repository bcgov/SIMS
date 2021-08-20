import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  ApplicationService,
  EducationProgramOfferingService,
} from "../../services";
import { ApplicationDataDto } from "./models/application.model";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  ProgramOfferingDto,
  UpdateProgramInfoDto,
  UpdateProgramInfoStatusDto,
  UpdateAssessmentStatusDto,
  UpdateCOEStatusDto,
  UpdateApplicationStatusDto,
} from "./models/application.system.model";

/**
 * Allow system access to the application data.
 * System access will give the ability to request acess from any
 * student data. This is required for external systems (e.g. workflow)
 * to process and have access to all data as needed.
 */
@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("system-access/application")
export class ApplicationSystemController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly offeringService: EducationProgramOfferingService,
  ) {}

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
      programYear: application.programYear.programYear,
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
   * Gets the offering associated with an application.
   * @param applicationId application id.
   * @returns offering associated with an application or
   * a HTTP 404 when the application does not exists or
   * there is no offering associated with it at this time.
   */
  @Get(":id/offering")
  async getApplicationOffering(
    @Param("id") applicationId: number,
  ): Promise<ProgramOfferingDto> {
    const offering = await this.applicationService.getOfferingByApplicationId(
      applicationId,
    );

    if (!offering) {
      throw new NotFoundException(
        `Not able to find an offering for application ${applicationId}.`,
      );
    }

    return {
      id: offering.id,
      studyStartDate: offering.studyStartDate,
      studyEndDate: offering.studyEndDate,
      breakStartDate: offering.breakStartDate,
      breakEndDate: offering.breakEndDate,
      actualTuitionCosts: offering.actualTuitionCosts,
      programRelatedCosts: offering.programRelatedCosts,
      mandatoryFees: offering.mandatoryFees,
      exceptionalExpenses: offering.exceptionalExpenses,
      tuitionRemittanceRequestedAmount:
        offering.tuitionRemittanceRequestedAmount,
      offeringDelivered: offering.offeringDelivered,
    };
  }
}
