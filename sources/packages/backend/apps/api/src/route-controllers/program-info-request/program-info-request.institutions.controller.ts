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
  Query,
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
  APPLICATION_NOT_FOUND,
  ApplicationService,
  PIRDeniedReasonService,
} from "../../services";
import { getUserFullName, STUDY_DATE_OVERLAP_ERROR } from "../../utilities";
import { CustomNamedError, getISODateOnlyString } from "@sims/utilities";
import {
  Application,
  AssessmentTriggerType,
  ProgramInfoStatus,
} from "@sims/sims-db";
import {
  EDUCATION_PROGRAM_IS_EXPIRED,
  EDUCATION_PROGRAM_IS_NOT_ACTIVE,
  OFFERING_DOES_NOT_BELONG_TO_LOCATION,
  OFFERING_INTENSITY_MISMATCH,
  OFFERING_PROGRAM_YEAR_MISMATCH,
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
import { WorkflowClientService } from "@sims/services";
import { InstitutionUserTypes } from "../../auth";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("location")
@ApiTags(
  `${ClientTypeBaseRoute.Institution}-location[Program Information Request - PIR]`,
)
export class ProgramInfoRequestInstitutionsController extends BaseController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly workflowClientService: WorkflowClientService,
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
    result.studentSelectedProgramDescription =
      application.pirProgram?.description;
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
      application.pirProgram?.id;
    result.isActiveProgram = application.pirProgram?.isActive;
    result.isExpiredProgram = application.pirProgram?.isExpired;
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
  @HasLocationAccess("locationId", [InstitutionUserTypes.user])
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
        // Send a message to inform the workflow of the declined PIR.
        await this.workflowClientService.sendProgramInfoCompletedMessage(
          applicationId,
          ProgramInfoStatus.declined,
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
  @ApiUnprocessableEntityResponse({
    description:
      "Study period overlap or offering program year mismatch or offering intensity mismatch.",
  })
  @ApiUnauthorizedResponse({
    description: "The location does not have access to the offering.",
  })
  @HasLocationAccess("locationId", [InstitutionUserTypes.user])
  @Patch(":locationId/program-info-request/application/:applicationId/complete")
  async completeProgramInfoRequest(
    @Param("locationId", ParseIntPipe) locationId: number,
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @Body() payload: CompleteProgramInfoRequestAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    try {
      await this.applicationService.validateApplicationOffering(
        applicationId,
        payload.selectedOffering,
        locationId,
      );
      // Complete PIR.
      await this.applicationService.setOfferingForProgramInfoRequest(
        applicationId,
        locationId,
        payload.selectedOffering,
        userToken.userId,
      );
      // Send a message to allow the workflow to proceed.
      await this.workflowClientService.sendProgramInfoCompletedMessage(
        applicationId,
        ProgramInfoStatus.completed,
      );
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case PIR_REQUEST_NOT_FOUND_ERROR:
            throw new NotFoundException(
              new ApiProcessError(error.message, error.name),
            );
          case APPLICATION_NOT_FOUND:
            throw new NotFoundException(error.message);
          case STUDY_DATE_OVERLAP_ERROR:
          case OFFERING_INTENSITY_MISMATCH:
            throw new UnprocessableEntityException(
              new ApiProcessError(error.message, error.name),
            );
          case OFFERING_PROGRAM_YEAR_MISMATCH:
          case EDUCATION_PROGRAM_IS_NOT_ACTIVE:
          case EDUCATION_PROGRAM_IS_EXPIRED:
            throw new UnprocessableEntityException(error.message);
          case OFFERING_DOES_NOT_BELONG_TO_LOCATION:
            throw new UnauthorizedException(error.message);
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
   * @param page page number for pagination.
   * @param pageLimit number of items per page.
   * @param sortField field to sort by.
   * @param sortOrder sort direction.
   * @returns paginated student application list of an institution location.
   */
  @HasLocationAccess("locationId")
  @Get(":locationId/program-info-request")
  async getPIRSummary(
    @Param("locationId", ParseIntPipe) locationId: number,
    @Query("page", ParseIntPipe) page = 1,
    @Query("pageLimit", ParseIntPipe) pageLimit = 10,
    @Query("sortField") sortField?: string,
    @Query("sortOrder") sortOrder?: "ASC" | "DESC",
  ): Promise<{ results: PIRSummaryAPIOutDTO[]; count: number }> {
    const { results: applications, count } =
      await this.applicationService.getPIRApplications(
        locationId,
        page,
        pageLimit,
        sortField,
        sortOrder,
      );

    return {
      results: applications.map((eachApplication: Application) => {
        const offering = eachApplication.currentAssessment?.offering;
        const user = eachApplication.student.user;
        return {
          applicationId: eachApplication.id,
          applicationNumber: eachApplication.applicationNumber,
          studyStartPeriod: getISODateOnlyString(offering?.studyStartDate),
          studyEndPeriod: getISODateOnlyString(offering?.studyEndDate),
          pirStatus: eachApplication.pirStatus,
          fullName: getUserFullName(user),
          submittedDate: getISODateOnlyString(eachApplication.submittedDate),
          givenNames: user.firstName,
          lastName: user.lastName,
          studentNumber: eachApplication.studentNumber,
          studyIntensity: offering?.offeringIntensity,
          program:
            offering?.educationProgram?.name ||
            eachApplication.pirProgram?.name,
        };
      }),
      count,
    };
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
