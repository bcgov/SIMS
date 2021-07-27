import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  UnprocessableEntityException,
} from "@nestjs/common";
import { ApplicationService } from "../../services";
import { GetApplicationDataDto } from "./models/application.model";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  ProgramOfferingDto,
  UpdateProgramInfoDto,
  UpdateProgramInfoStatusDto,
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
  constructor(private readonly applicationService: ApplicationService) {}

  @Get(":id")
  async getByApplicationId(
    @Param("id") applicationId: number,
  ): Promise<GetApplicationDataDto> {
    const application = await this.applicationService.findById(applicationId);
    if (!application) {
      throw new NotFoundException(
        `Application id ${applicationId} was not found.`,
      );
    }

    return { data: application.data };
  }

  @Patch(":id/program-info")
  async updateProgramInfoRequest(
    @Param("id") applicationId: number,
    @Body() payload: UpdateProgramInfoDto,
  ): Promise<void> {
    console.log(payload);

    const updateResult = await this.applicationService.updateProgramInfo(
      applicationId,
      payload.locationId,
      payload.status,
      payload.offeringId,
    );

    if (updateResult.affected === 0) {
      throw new UnprocessableEntityException(
        "Not able to update the program information request with provided data.",
      );
    }
  }

  @Patch(":id/program-info/status")
  async updateProgramInfoRequestStatus(
    @Param("id") applicationId: number,
    @Body() payload: UpdateProgramInfoStatusDto,
  ): Promise<void> {
    const updateResult = await this.applicationService.updateProgramInfoStatus(
      applicationId,
      payload.status,
    );

    if (updateResult.affected === 0) {
      throw new UnprocessableEntityException(
        "Not able to update the program information request status with provided data.",
      );
    }
  }

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
