import {
  Controller,
  Patch,
  Param,
  Body,
  UnauthorizedException,
  UnprocessableEntityException,
  InternalServerErrorException,
  Get,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import {
  CompleteProgramInfoRequestDto,
  DenyProgramInfoRequestDto,
  GetProgramInfoRequestDto,
  GetPIRDeniedReasonDto,
} from "./models/program-info-request.dto";
import { HasLocationAccess, AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  ApplicationService,
  EducationProgramOfferingService,
  WorkflowActionsService,
  PIR_REQUEST_NOT_FOUND_ERROR,
  FormService,
  PIRDeniedReasonService,
} from "../../services";
import {
  getUserFullName,
  CustomNamedError,
  checkNotValidStudyPeriod,
  checkStudyStartDateWithinProgramYear,
  checkOfferingIntensityMismatch,
  getISODateOnlyString,
} from "../../utilities";
import {
  EducationProgramOffering,
  ProgramInfoStatus,
  Application,
  AssessmentTriggerType,
} from "../../database/entities";
import { PIRSummaryDTO } from "../application/models/application.model";
import { FormNames } from "../../services/form/constants";
import {
  OFFERING_START_DATE_ERROR,
  INVALID_STUDY_DATES,
  OFFERING_INTENSITY_MISMATCH,
} from "../../constants";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("institution/location")
@ApiTags("institution")
export class ProgramInfoRequestController extends BaseController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly workflowService: WorkflowActionsService,
    private readonly offeringService: EducationProgramOfferingService,
    private readonly pirDeniedReasonService: PIRDeniedReasonService,
    private readonly formService: FormService,
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
  @HasLocationAccess("locationId")
  @Get(":locationId/program-info-request/application/:applicationId")
  async getProgramInfoRequest(
    @Param("locationId") locationId: number,
    @Param("applicationId") applicationId: number,
  ): Promise<GetProgramInfoRequestDto> {
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
        `Student application is missing original assessment ${AssessmentTriggerType.OriginalAssessment}.`,
      );
    }
    // Offering that belongs to the original assessment.
    const offering = application.currentAssessment.offering;
    const result = {} as GetProgramInfoRequestDto;
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
      result.studyStartDate = offering.studyStartDate;
      result.studyEndDate = offering.studyEndDate;
      result.actualTuitionCosts = offering.actualTuitionCosts;
      result.programRelatedCosts = offering.programRelatedCosts;
      result.mandatoryFees = offering.mandatoryFees;
      result.exceptionalExpenses = offering.exceptionalExpenses;
      result.tuitionRemittanceRequestedAmount =
        offering.tuitionRemittanceRequestedAmount;
      result.offeringDelivered = offering.offeringDelivered;
      result.lacksStudyBreaks = offering.lacksStudyBreaks;
      result.tuitionRemittanceRequested = offering.tuitionRemittanceRequested;
      result.offeringType = offering.offeringType;
      result.offeringIntensity = offering.offeringIntensity;
    }

    result.pirDenyReasonId = application.pirDeniedReasonId?.id;
    result.otherReasonDesc = application.pirDeniedOtherDesc;
    result.programYearStartDate = application.programYear.startDate;
    result.programYearEndDate = application.programYear.endDate;

    return result;
  }

  /**
   * Deny the Program Info Request (PIR), defining the
   * PIR status as Declined in the student application table.
   * @param locationId location that is completing the PIR.
   * @param applicationId application id to be updated.
   * @param payload contains the denied reason of the
   * student application.
   */
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
      if (application.assessmentWorkflowId) {
        await this.workflowService.deleteApplicationAssessment(
          application.assessmentWorkflowId,
        );
      }
    } catch (error) {
      if (error.name === PIR_REQUEST_NOT_FOUND_ERROR) {
        throw new UnprocessableEntityException(error.message);
      }

      throw new InternalServerErrorException(
        "Error while denying a Program Information Request (PIR).",
      );
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
    @Body() payload: CompleteProgramInfoRequestDto,
  ): Promise<void> {
    try {
      const submissionResult = await this.formService.dryRunSubmission(
        FormNames.ProgramInformationRequest,
        payload,
      );
      if (!submissionResult.valid) {
        throw new BadRequestException(
          "Not able to complete the Program Information Request due to an invalid request.",
        );
      }
      // TODO: Check authorization to ensure that the location has access to this application.
      const application = await this.applicationService.getApplicationById(
        applicationId,
      );
      if (!application) {
        throw new BadRequestException("Application not found.");
      }
      // studyStartDate from payload is set as studyStartDate
      let studyStartDate = payload.studyStartDate;
      let selectedOfferingIntensity = payload.offeringIntensity;
      if (payload.selectedOffering) {
        const offering = await this.offeringService.getOfferingById(
          payload.selectedOffering,
        );
        // if studyStartDate is not in payload
        // then selectedOffering will be there in payload,
        // then study start date taken from offering
        studyStartDate = offering.studyStartDate;
        selectedOfferingIntensity = offering.offeringIntensity;
      }
      if (
        !checkOfferingIntensityMismatch(
          application.data.howWillYouBeAttendingTheProgram,
          selectedOfferingIntensity,
        )
      ) {
        throw new CustomNamedError(
          "Offering Intensity does not match the students intensity",
          OFFERING_INTENSITY_MISMATCH,
        );
      }
      if (
        !checkStudyStartDateWithinProgramYear(
          studyStartDate,
          application.programYear,
        )
      ) {
        throw new CustomNamedError(
          "study start date should be within the program year of the students application",
          OFFERING_START_DATE_ERROR,
        );
      }

      let offeringToCompletePIR: EducationProgramOffering;
      if (payload.selectedOffering) {
        // Check if the offering belongs to the location.
        const offeringLocationId =
          await this.offeringService.getOfferingLocationId(
            payload.selectedOffering,
          );
        if (offeringLocationId !== locationId) {
          throw new UnauthorizedException(
            "The location does not have access to the offering.",
          );
        }
        // Offering exists, is valid and just need to be associated
        // with the application to complete the PIR.
        offeringToCompletePIR = {
          id: payload.selectedOffering,
        } as EducationProgramOffering;
      } else {
        // check valid study period
        const notValidDates = checkNotValidStudyPeriod(
          payload.studyStartDate,
          payload.studyEndDate,
        );
        if (notValidDates) {
          throw new CustomNamedError(notValidDates, INVALID_STUDY_DATES);
        }
        // Offering does not exists and it is going to be created and
        // associated with the application to complete the PIR.
        offeringToCompletePIR = this.offeringService.populateProgramOffering(
          locationId,
          payload.selectedProgram,
          submissionResult.data.data,
        );
      }

      const updatedApplication =
        await this.applicationService.setOfferingForProgramInfoRequest(
          applicationId,
          locationId,
          offeringToCompletePIR,
        );

      if (updatedApplication) {
        // Send a message to allow the workflow to proceed.
        await this.workflowService.sendProgramInfoCompletedMessage(
          updatedApplication.assessmentWorkflowId,
        );
      }
    } catch (error) {
      if (
        [
          PIR_REQUEST_NOT_FOUND_ERROR,
          OFFERING_START_DATE_ERROR,
          INVALID_STUDY_DATES,
          OFFERING_INTENSITY_MISMATCH,
        ].includes(error.name)
      ) {
        throw new UnprocessableEntityException(
          `${error.name} ${error.message}`,
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
