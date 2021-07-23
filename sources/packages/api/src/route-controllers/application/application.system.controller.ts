import { Controller, Get, Patch, NotFoundException, Param, Body } from "@nestjs/common";
import { ApplicationService } from "../../services";
import { GetApplicationDataDto, ApplicationAssessmentDTO } from "./models/application.model";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";

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

  @Patch(":applicationId/assessment")
  async updateAssessmentInApplication(
    @Body() assessment: ApplicationAssessmentDTO,
    @Param("applicationId") applicationId: number,
  ): Promise<number> {
    const application = await this.getByApplicationId(applicationId);
    const updateAssessmentInApplication = await this.applicationService.updateAssessmentInApplication(
      applicationId,
      application,
      assessment,
    );
    return updateAssessmentInApplication.affected;
  }

  @Get(":applicationId/assessment")
  async getAssessmentInApplication(
    @Param("applicationId") applicationId: number,
  ): Promise<ApplicationAssessmentDTO> {
    const assessment = await this.applicationService.getAssessmentByApplicationId(applicationId);
    if (!assessment) {
      throw new NotFoundException(
        `Assessment for the applicaiton id ${applicationId} was not calculated.`,
      );
    }

    return assessment;
  }
}
