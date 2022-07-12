import {
  Controller,
  Patch,
  Param,
  Body,
  UnprocessableEntityException,
  InternalServerErrorException,
  Get,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  CompleteProgramInfoRequestAPIInDTO,
  DenyProgramInfoRequestDto,
  ProgramInfoRequestAPIOutDTO,
  GetPIRDeniedReasonDto,
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
  PIR_REQUEST_NOT_FOUND_ERROR,
  PIRDeniedReasonService,
  PIR_DENIED_REASON_NOT_FOUND_ERROR,
} from "../../services";
import {
  getUserFullName,
  getISODateOnlyString,
  PIR_OR_DATE_OVERLAP_ERROR,
} from "../../utilities";
import {
  EducationProgramOffering,
  ProgramInfoStatus,
  Application,
  AssessmentTriggerType,
} from "../../database/entities";
import { PIRSummaryDTO } from "../application/models/application.model";
import { OFFERING_INTENSITY_MISMATCH } from "../../constants";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import BaseController from "../BaseController";
import { ApiProcessError } from "../../types";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("institution/location")
@ApiTags("institution")
export class ProgramInfoRequestController extends BaseController {
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
   * Once the PIR is completed, it provides the data that express how
   * the PIR was completed. It could be completed by select an existing
   * offering, creating a new public offering or creating a new offering
   * specific to the student application.
   * @param locationId
   * @param applicationId
   * @returns program info request
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
    @Param("locationId") locationId: number,
    @Param("applicationId") applicationId: number,
  ): Promise<ProgramInfoRequestAPIOutDTO> {
    const application = await this.applicationService.getProgramInfoRequest(
      locationId,
      applicationId,
    );
    if (!application) {
      throw new NotFoundException(
        "The application was not found under the provided location.",
      );
    }
    if (
      !application.pirStatus ||
      application.pirStatus === ProgramInfoStatus.notRequired
    ) {
      throw new NotFoundException(
        "Program Information Request (PIR) not found.",
      );
    }
    // Original assessment to be used as a reference.
    // PIR process happens only during original assessment.
    if (
      application.currentAssessment.triggerType !==
      AssessmentTriggerType.OriginalAssessment
    ) {
      throw new UnprocessableEntityException(
        "Student application is missing original assessment.",
      );
    }
    // Offering that belongs to the original assessment.
    const offering = application.currentAssessment.offering;
    const result = {} as ProgramInfoRequestAPIOutDTO;
    // Program Info Request specific data.
    result.institutionLocationName = application.location.name;
    result.applicationNumber = application.applicationNumber;
    result.studentFullName = getUserFullName(application.student.user);
    result.studentSelectedProgram = application.pirProgram?.name;

    // If an offering is present, this value will be the program id associated
    // with the offering, otherwise the program id from PIR will be used.
    result.selectedProgram =
      offering?.educationProgram.id ?? application.pirProgram?.id;
    result.selectedOffering = offering?.id;
    result.pirStatus = application.pirStatus;
    // Load application dynamic data.
    result.studentCustomProgram = application.data.programName;
    result.studentCustomProgramDescription =
      application.data.programDescription;
    result.studentStudyStartDate = application.data.studystartDate;
    result.studentStudyEndDate = application.data.studyendDate;
    result.offeringIntensitySelectedByStudent =
      application.data.howWillYouBeAttendingTheProgram;
    result.programYearId = application.programYear.id;
    result.isActiveProgramYear = application.programYear.active;
    if (offering) {
      result.offeringName = offering.name;
      result.offeringType = offering.offeringType;
      result.offeringIntensity = offering.offeringIntensity;
    }
    result.courseDetails = application.data.courseDetails;
    result.pirDenyReasonId = application.pirDeniedReasonId?.id;
    result.otherReasonDesc = application.pirDeniedOtherDesc;
    return result;
  }

  /**
   * Deny the Program Info Request (PIR), defining the
   * PIR status as Declined in the student application table.
   * @param locationId location that is completing the PIR.
   * @param applicationId application id to be updated.
   * @param payload contains the denied reason of the student application.
   */
  @ApiUnprocessableEntityResponse({
    description:
      "Not able to find an application that requires a PIR to be completed or 'Other' is selected as PIR reason but the reason was not provided.",
  })
  @HasLocationAccess("locationId")
  @Patch(":locationId/program-info-request/application/:applicationId/deny")
  async denyProgramInfoRequest(
    @Param("locationId") locationId: number,
    @Param("applicationId") applicationId: number,
    @Body() payload: DenyProgramInfoRequestDto,
  ): Promise<void> {
    try {
      const application =
        await this.applicationService.setDeniedReasonForProgramInfoRequest(
          applicationId,
          locationId,
          payload.pirDenyReasonId,
          payload.otherReasonDesc,
        );
      if (application.currentAssessment.assessmentWorkflowId) {
        await this.workflowService.deleteApplicationAssessment(
          application.currentAssessment.assessmentWorkflowId,
        );
      }
    } catch (error) {
      switch (error.name) {
        case PIR_REQUEST_NOT_FOUND_ERROR:
        case PIR_DENIED_REASON_NOT_FOUND_ERROR:
          throw new UnprocessableEntityException(error.message);
        default:
          throw error;
      }
    }
  }

  /**
   * Completes the Program Info Request (PIR), defining the
   * PIR status as completed in the student application table.
   * The PIR could be completed by select an existing offering,
   * creating a new public offering or creating a new offering
   * specific to the student application.
   * @param locationId location that is completing the PIR.
   * @param applicationId application id to be updated.
   * @param payload contains the offering id to be updated in the
   * student application or the information to create a new PIR.
   */
  @HasLocationAccess("locationId")
  @Patch(":locationId/program-info-request/application/:applicationId/complete")
  async completeProgramInfoRequest(
    @Param("locationId") locationId: number,
    @Param("applicationId") applicationId: number,
    @Body() payload: CompleteProgramInfoRequestAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    try {
      // TODO: Check authorization to ensure that the location has access to this application.
      const application = await this.applicationService.getApplicationById(
        applicationId,
      );
      if (!application) {
        throw new BadRequestException("Application not found.");
      }

      // Check if the offering belongs to the location.
      const offeringLocation = await this.offeringService.getOfferingLocationId(
        payload.selectedOffering,
      );

      if (offeringLocation?.institutionLocation.id !== locationId) {
        throw new UnauthorizedException(
          "The location does not have access to the offering.",
        );
      }
      const studyStartDate = offeringLocation.studyStartDate;
      const studyEndDate = offeringLocation.studyEndDate;
      // Offering exists, is valid and just need to be associated
      // with the application to complete the PIR.
      const offeringToCompletePIR = {
        id: payload.selectedOffering,
      } as EducationProgramOffering;

      await this.applicationService.validateOverlappingDatesAndPIR(
        applicationId,
        application.student.user.lastName,
        application.student.user.id,
        application.student.sinValidation.sin,
        application.student.birthDate,
        studyStartDate,
        studyEndDate,
      );

      const updatedApplication =
        await this.applicationService.setOfferingForProgramInfoRequest(
          applicationId,
          locationId,
          offeringToCompletePIR,
          userToken.userId,
        );

      if (updatedApplication) {
        // Send a message to allow the workflow to proceed.
        await this.workflowService.sendProgramInfoCompletedMessage(
          updatedApplication.currentAssessment.assessmentWorkflowId,
        );
      }
    } catch (error) {
      if (
        [
          PIR_OR_DATE_OVERLAP_ERROR,
          PIR_REQUEST_NOT_FOUND_ERROR,
          OFFERING_INTENSITY_MISMATCH,
        ].includes(error.name)
      ) {
        throw new UnprocessableEntityException(
          new ApiProcessError(error.message, error.name),
        );
      }
      throw new InternalServerErrorException(
        "Error while completing a Program Information Request (PIR).",
      );
    }
  }

  /**
   * Get all application of a location in an institution
   * with Program Info Request (PIR) status completed and required
   * @param locationId location that is completing the PIR.
   * @returns student application list of an institution location
   */
  @HasLocationAccess("locationId")
  @Get(":locationId/program-info-request")
  async getPIRSummary(
    @Param("locationId") locationId: number,
  ): Promise<PIRSummaryDTO[]> {
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
    }) as PIRSummaryDTO[];
  }

  /**
   * Get all PIR denied reason ,which are active
   * @returns PIR denied reason list
   */
  @Get("program-info-request/denied-reason")
  async getPIRDeniedReason(): Promise<GetPIRDeniedReasonDto[]> {
    const pirDeniedReason =
      await this.pirDeniedReasonService.getPIRDeniedReasons();
    return pirDeniedReason.map((eachPIRDeniedReason) => {
      return {
        id: eachPIRDeniedReason.id,
        description: eachPIRDeniedReason.reason,
      };
    }) as GetPIRDeniedReasonDto[];
  }
}
