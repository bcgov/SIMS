import {
  Controller,
  Patch,
  Param,
  Body,
  UnprocessableEntityException,
  InternalServerErrorException,
  Get,
  NotFoundException,
  UnauthorizedException,
  ParseIntPipe,
} from "@nestjs/common";
import {
  CompleteProgramInfoRequestAPIInDTO,
  DenyProgramInfoRequestAPIInDTO,
  ProgramInfoRequestAPIOutDTO,
  PIRDeniedReasonAPIOutDTO,
  PIRSummaryAPIOutDTO,
} from "./models/program-info-request.dto";
import {
  HasLocationAccess,
  AllowAuthorizedParty,
  UserToken,
} from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { IUserToken } from "../../auth/userToken.interface";
import {
  ApplicationService,
  EducationProgramOfferingService,
  WorkflowActionsService,
  PIRDeniedReasonService,
} from "../../services";
import {
  getUserFullName,
  getISODateOnlyString,
  PIR_OR_DATE_OVERLAP_ERROR,
  CustomNamedError,
} from "../../utilities";
import { Application, AssessmentTriggerType } from "../../database/entities";
import {
  OFFERING_INTENSITY_MISMATCH,
  PIR_DENIED_REASON_NOT_FOUND_ERROR,
  PIR_REQUEST_NOT_FOUND_ERROR,
} from "../../constants";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import BaseController from "../BaseController";
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("location")
@ApiTags(
  `${ClientTypeBaseRoute.Institution}-location[Program Information Request - PIR]`,
)
export class ProgramInfoRequestInstitutionsController extends BaseController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly workflowService: WorkflowActionsService,
    private readonly offeringService: EducationProgramOfferingService,
    private readonly pirDeniedReasonService: PIRDeniedReasonService,
  ) {
    super();
  }

  /**
   * Gets the information to show a Program Information Request (PIR)
   * with the data provided by the student, either when student select
   * an existing program or not.
   * @param locationId location id.
   * @param applicationId application id.
   * @returns program information request.
   */
  @ApiNotFoundResponse({
    description:
      "The application was not found under the provided location or the application is not expecting a Program Information Request (PIR) at this moment.",
  })
  @ApiUnprocessableEntityResponse({
    description: "Student application is missing original assessment.",
  })
  @HasLocationAccess("locationId")
  @Get(":locationId/program-info-request/application/:applicationId")
  async getProgramInfoRequest(
    @Param("locationId", ParseIntPipe) locationId: number,
    @Param("applicationId", ParseIntPipe) applicationId: number,
  ): Promise<ProgramInfoRequestAPIOutDTO> {
    const application = await this.applicationService.getProgramInfoRequest(
      locationId,
      applicationId,
    );
    if (!application) {
      throw new NotFoundException(
        "The application was not found under the provided location or the application is not expecting a Program Information Request (PIR) at this moment.",
      );
    }

    const result = {} as ProgramInfoRequestAPIOutDTO;
    result.institutionLocationName = application.location.name;
    result.applicationNumber = application.applicationNumber;
    result.studentFullName = getUserFullName(application.student.user);
    result.pirStatus = application.pirStatus;
    // Student application dynamic data.
    result.studentCustomProgram = application.data.programName;
    result.studentCustomProgramDescription =
      application.data.programDescription;
    result.studentStudyStartDate = application.data.studystartDate;
    result.studentStudyEndDate = application.data.studyendDate;
    result.courseDetails = application.data.courseDetails;
    result.pirDenyReasonId = application.pirDeniedReasonId?.id;
    result.otherReasonDesc = application.pirDeniedOtherDesc;
    result.offeringIntensitySelectedByStudent =
      application.data.howWillYouBeAttendingTheProgram;
    // Program year data.
    result.programYearId = application.programYear.id;
    result.isActiveProgramYear = application.programYear.active;
    // Education program, if selected by the student.
    result.studentSelectedProgram = application.pirProgram?.name;
    // Original assessment to be used as a reference for the PIR (original
    // assessment always available for submitted student applications).
    // PIR process happens only during original assessment.
    // Offering available only when PIR is completed.
    const originalAssessmentOffering = application.studentAssessments.find(
      (assessment) =>
        assessment.triggerType === AssessmentTriggerType.OriginalAssessment,
    ).offering;
    // If an offering is present (PIR is completed), this value will be the
    // program id associated with the offering, otherwise the program id
    // from PIR (sims.applications table) will be used.
    result.selectedProgram =
      originalAssessmentOffering?.educationProgram.id ??
      application.pirProgram.id;
    // Offering only available when PIR is completed.
    if (originalAssessmentOffering) {
      result.selectedOffering = originalAssessmentOffering.id;
      result.offeringName = originalAssessmentOffering.name;
      result.offeringType = originalAssessmentOffering.offeringType;
      result.offeringIntensity = originalAssessmentOffering.offeringIntensity;
    }
    return result;
  }

  /**
   * Deny the Program Info Request (PIR), defining the
   * PIR status as Declined in the student application table.
   * @param locationId location that is completing the PIR.
   * @param applicationId application id to be updated.
   * @param payload contains the denied reason of the student application.
   */
  @ApiNotFoundResponse({
    description:
      "Not able to find an application that requires a PIR to be completed.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "'Other' is selected as PIR reason but the reason was not provided.",
  })
  @HasLocationAccess("locationId")
  @Patch(":locationId/program-info-request/application/:applicationId/deny")
  async denyProgramInfoRequest(
    @Param("locationId", ParseIntPipe) locationId: number,
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @Body() payload: DenyProgramInfoRequestAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    try {
      const application =
        await this.applicationService.setDeniedReasonForProgramInfoRequest(
          applicationId,
          locationId,
          payload.pirDenyReasonId,
          userToken.userId,
          payload.otherReasonDesc,
        );
      if (application.currentAssessment.assessmentWorkflowId) {
        await this.workflowService.deleteApplicationAssessment(
          application.currentAssessment.assessmentWorkflowId,
        );
      }
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case PIR_REQUEST_NOT_FOUND_ERROR:
            throw new NotFoundException(error.message);
          case PIR_DENIED_REASON_NOT_FOUND_ERROR:
            throw new UnprocessableEntityException(error.message);
        }
      }
      throw error;
    }
  }

  /**
   * Completes the Program Info Request (PIR), defining the
   * PIR status as completed in the student application table.
   * The PIR is completed by select an existing offering.
   * @param locationId location that is completing the PIR.
   * @param applicationId application id to be updated.
   * @param payload offering to be updated in the student application.
   */
  @ApiNotFoundResponse({
    description:
      "Application not found or not able to find an application that requires a PIR to be completed.",
  })
  @ApiUnauthorizedResponse({
    description: "The location does not have access to the offering.",
  })
  @HasLocationAccess("locationId")
  @Patch(":locationId/program-info-request/application/:applicationId/complete")
  async completeProgramInfoRequest(
    @Param("locationId", ParseIntPipe) locationId: number,
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @Body() payload: CompleteProgramInfoRequestAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    // Validate if the application exists and the location has access to it.
    const application = await this.applicationService.getProgramInfoRequest(
      locationId,
      applicationId,
    );
    if (!application) {
      throw new NotFoundException("Application not found.");
    }
    // Validates if the offering exists and belongs to the location.
    const offering = await this.offeringService.getOfferingLocationId(
      payload.selectedOffering,
    );
    if (offering?.institutionLocation.id !== locationId) {
      throw new UnauthorizedException(
        "The location does not have access to the offering.",
      );
    }

    try {
      // Validate possible overlaps with exists applications.
      await this.applicationService.validateOverlappingDatesAndPIR(
        applicationId,
        application.student.user.lastName,
        application.student.user.id,
        application.student.sinValidation.sin,
        application.student.birthDate,
        offering.studyStartDate,
        offering.studyEndDate,
      );
      // Complete PIR.
      const updatedApplication =
        await this.applicationService.setOfferingForProgramInfoRequest(
          applicationId,
          locationId,
          offering.id,
          userToken.userId,
        );
      // Send a message to allow the workflow to proceed.
      await this.workflowService.sendProgramInfoCompletedMessage(
        updatedApplication.currentAssessment.assessmentWorkflowId,
      );
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case PIR_REQUEST_NOT_FOUND_ERROR:
            throw new NotFoundException(
              new ApiProcessError(error.message, error.name),
            );
          case PIR_OR_DATE_OVERLAP_ERROR:
          case OFFERING_INTENSITY_MISMATCH:
            throw new UnprocessableEntityException(
              new ApiProcessError(error.message, error.name),
            );
        }
      }
      throw new InternalServerErrorException(
        "Error while completing a Program Information Request (PIR).",
      );
    }
  }

  /**
   * Get all applications of a location in an institution
   * with Program Info Request (PIR) status completed and required
   * @param locationId location that is completing the PIR.
   * @returns student application list of an institution location.
   */
  @HasLocationAccess("locationId")
  @Get(":locationId/program-info-request")
  async getPIRSummary(
    @Param("locationId", ParseIntPipe) locationId: number,
  ): Promise<PIRSummaryAPIOutDTO[]> {
    const applications = await this.applicationService.getPIRApplications(
      locationId,
    );
    return applications.map((eachApplication: Application) => {
      const offering = eachApplication.currentAssessment?.offering;
      return {
        applicationId: eachApplication.id,
        applicationNumber: eachApplication.applicationNumber,
        studyStartPeriod: getISODateOnlyString(offering?.studyStartDate),
        studyEndPeriod: getISODateOnlyString(offering?.studyEndDate),
        pirStatus: eachApplication.pirStatus,
        fullName: getUserFullName(eachApplication.student.user),
      };
    });
  }

  /**
   * Get all PIR denied reasons, which are active.
   * @returns PIR denied reason list.
   */
  @Get("program-info-request/denied-reason")
  async getPIRDeniedReason(): Promise<PIRDeniedReasonAPIOutDTO[]> {
    const pirDeniedReason =
      await this.pirDeniedReasonService.getPIRDeniedReasons();
    return pirDeniedReason.map((eachPIRDeniedReason) => ({
      id: eachPIRDeniedReason.id,
      description: eachPIRDeniedReason.reason,
    }));
  }
}
