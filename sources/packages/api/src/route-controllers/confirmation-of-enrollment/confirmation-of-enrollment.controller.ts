import {
  Controller,
  Param,
  Get,
  Post,
  NotFoundException,
  UnprocessableEntityException,
  ForbiddenException,
} from "@nestjs/common";
import { HasLocationAccess, AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  ApplicationService,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
  APPLICATION_NOT_FOUND,
  WorkflowActionsService,
  InstitutionLocationService,
} from "../../services";
import { Application, COEStatus } from "../../database/entities";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import {
  COESummaryDTO,
  ApplicationDetailsForCOEDTO,
} from "../application/models/application.model";
import { getUserFullName } from "../../utilities/auth-utils";
import { common } from "../../utilities";
const { getUTCNow, dateString } = common();

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("institution/location")
export class ConfirmationOfEnrollmentController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly workflow: WorkflowActionsService,
    private readonly locationService: InstitutionLocationService,
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

  /**
   * Get the application details for Confirmation Of Enrollment(COE)
   * @param locationId location id
   * @param applicationId application id
   * @returns application details for COE
   */
  @AllowAuthorizedParty(AuthorizedParties.institution)
  @HasLocationAccess("locationId")
  @Get(":locationId/confirmation-of-enrollment/application/:applicationId")
  async getApplicationForCOE(
    @Param("locationId") locationId: number,
    @Param("applicationId") applicationId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<ApplicationDetailsForCOEDTO> {
    const requestedLoc = await this.locationService.getInstitutionLocationById(
      locationId,
    );
    if (
      userToken.authorizations.institutionId !== requestedLoc.institution.id
    ) {
      throw new ForbiddenException();
    }
    const application =
      await this.applicationService.getApplicationDetailsForCOE(
        locationId,
        applicationId,
      );
    return {
      applicationProgramName: application.offering.educationProgram.name,
      applicationProgramDescription:
        application.offering.educationProgram.description,
      applicationOfferingName: application.offering.name,
      applicationOfferingIntensity: application.offering.offeringIntensity,
      applicationOfferingStartDate: dateString(
        application.offering.studyStartDate,
      ),
      applicationOfferingEndDate: dateString(application.offering.studyEndDate),
      applicationOfferingHasStudyBreak: application.offering.lacksStudyBreaks,
      applicationOfferingBreakStartDate: dateString(
        application.offering.breakStartDate,
      ),
      applicationOfferingBreakEndDate: dateString(
        application.offering.breakEndDate,
      ),
      applicationOfferingActualTuition: application.offering.actualTuitionCosts,
      applicationOfferingProgramRelatedCost:
        application.offering.programRelatedCosts,
      applicationOfferingMandatoryCost: application.offering.mandatoryFees,
      applicationOfferingExceptionalExpenses:
        application.offering.exceptionalExpenses,
      applicationOfferingHasTuitionRemittanceRequested:
        application.offering.tuitionRemittanceRequested,
      applicationOfferingTuitionRemittanceAmount:
        application.offering.tuitionRemittanceRequestedAmount,
      applicationOfferingStudyDelivered: application.offering.offeringDelivered,
      applicationStudentName: getUserFullName(application.student.user),
      applicationNumber: application.applicationNumber,
      applicationLocationName: application.location.name,
      applicationStatus: application.applicationStatus,
    };
  }

  /**
   * Confirm Enrollment
\   * @param applicationId application to be rolled back.
   */
  @HasLocationAccess("locationId")
  @Post("confirmation-of-enrollment/application/:applicationId/confirm")
  async confirmEnrollment(
    @Param("applicationId") applicationId: number,
  ): Promise<void> {
    const application = await this.applicationService.getApplicationById(
      applicationId,
    );
    await this.applicationService.updateCOEStatus(
      applicationId,
      COEStatus.submitted,
    );

    // Send a message to allow the workflow to proceed.
    await this.workflow.sendConfirmCOEMessage(application.assessmentWorkflowId);
  }
}
