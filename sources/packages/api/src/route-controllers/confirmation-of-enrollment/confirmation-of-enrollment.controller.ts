import {
  Controller,
  Param,
  Get,
  Post,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { HasLocationAccess, AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  ApplicationService,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
  APPLICATION_NOT_FOUND,
  WorkflowActionsService,
} from "../../services";
import { Application } from "../../database/entities";
import { COESummaryDTO } from "../application/models/application.model";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("institution/location")
export class ConfirmationOfEnrollmentController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly workflow: WorkflowActionsService,
  ) {}

  /**
   * Get all application of a location in a institution
   * with Confirmation Of Enrollment(COE) status completed and required
   * @param locationId location that is completing the COE.
   * @returns student application list of an institution location
   */
  @HasLocationAccess("locationId")
  @Get(":locationId/confirmation-of-enrollment")
  async getCOESummary(
    @Param("locationId") locationId: number,
  ): Promise<COESummaryDTO[]> {
    const applications = await this.applicationService.getCOEApplications(
      locationId,
    );
    return applications.map((eachApplication: Application) => {
      return {
        applicationNumber: eachApplication.applicationNumber,
        applicationId: eachApplication.id,
        studyStartPeriod: eachApplication.offering?.studyStartDate ?? "",
        studyEndPeriod: eachApplication.offering?.studyEndDate ?? "",
        coeStatus: eachApplication.coeStatus,
        firstName: eachApplication.student.user.firstName,
        lastName: eachApplication.student.user.lastName,
      };
    }) as COESummaryDTO[];
  }

  /**
   * Creates a new Student Application to maintain history,
   * overriding the current one in order to rollback the
   * process and start the assessment all over again.
   * @param locationId location id executing the COE rollback.
   * @param applicationId application to be rolled back.
   * @returns the id of the newly created Student Application.
   */
  @HasLocationAccess("locationId")
  @Post(
    ":locationId/confirmation-of-enrollment/application/:applicationId/rollback",
  )
  async startCOERollback(
    @Param("locationId") locationId: number,
    @Param("applicationId") applicationId: number,
  ): Promise<number> {
    try {
      const result = await this.applicationService.overrideApplicationForCOE(
        locationId,
        applicationId,
      );

      if (result.overriddenApplication.assessmentWorkflowId) {
        await this.workflow.deleteApplicationAssessment(
          result.overriddenApplication.assessmentWorkflowId,
        );
      }

      await this.applicationService.startApplicationAssessment(
        result.createdApplication.id,
      );

      return result.createdApplication.id;
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
}
