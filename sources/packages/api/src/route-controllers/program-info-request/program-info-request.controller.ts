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
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import {
  CompleteProgramInfoRequestDto,
  GetProgramInfoRequestDto,
} from "./models/program-info-request.dto";
import { HasLocationAccess, AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  ApplicationService,
  EducationProgramOfferingService,
  WorkflowActionsService,
  PIR_REQUEST_NOT_FOUND_ERROR,
  InstitutionService,
  InstitutionLocationService,
  FormService,
} from "../../services";
import { getUserFullName } from "../../utilities/auth-utils";
import {
  EducationProgram,
  EducationProgramOffering,
  InstitutionLocation,
  OfferingTypes,
  ProgramInfoStatus,
} from "../../database/entities";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import { PIRSummaryDTO } from "../application/models/application.model";
import { Application } from "../../database/entities";
import { FormNames } from "../../services/form/constants";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("institution/location")
export class ProgramInfoRequestController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly workflowService: WorkflowActionsService,
    private readonly offeringService: EducationProgramOfferingService,
    private readonly institutionService: InstitutionService,
    private readonly locationService: InstitutionLocationService,
    private readonly formService: FormService,
  ) {}

  @HasLocationAccess("locationId")
  @Get(":locationId/program-info-request/application/:applicationId")
  async getProgramInfoRequest(
    @Param("locationId") locationId: number,
    @Param("applicationId") applicationId: number,
  ): Promise<GetProgramInfoRequestDto> {
    const application = await this.applicationService.getApplicationForLocation(
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

    const result = {} as GetProgramInfoRequestDto;
    // Program Info Request specific data.
    result.institutionLocationName = application.location.name;
    result.applicationNumber = application.applicationNumber;
    result.studentFullName = getUserFullName(application.student.user);
    result.studentSelectedProgram = application.program?.name;
    result.selectedProgram = application.program?.id;
    result.selectedOffering = application.offering?.id;
    result.pirStatus = application.pirStatus;
    // Load application dynamic data
    result.studentCustomProgram = application.data.programName;
    result.studentCustomProgramDescription =
      application.data.programDescription;
    result.studentStudyStartDate = application.data.studystartDate;
    result.studentStudyEndDate = application.data.studyendDate;

    if (application.offering) {
      result.offeringName = application.offering.name;
      result.studyStartDate = application.offering.studyEndDate;
      result.studyEndDate = application.offering.studyEndDate;
      result.breakStartDate = application.offering.breakStartDate;
      result.breakEndDate = application.offering.breakEndDate;
      result.actualTuitionCosts = application.offering.actualTuitionCosts;
      result.programRelatedCosts = application.offering.programRelatedCosts;
      result.mandatoryFees = application.offering.mandatoryFees;
      result.exceptionalExpenses = application.offering.exceptionalExpenses;
      result.tuitionRemittanceRequestedAmount =
        application.offering.tuitionRemittanceRequestedAmount;
      result.offeringDelivered = application.offering.offeringDelivered;
      result.lacksStudyBreaks = application.offering.lacksStudyBreaks;
      result.tuitionRemittanceRequested =
        application.offering.tuitionRemittanceRequested;
      result.offeringType = application.offering.offeringType;
    }

    return result;
  }

  /**
   * Completes the Program Info Request (PIR), defining the PIR status as
   * completed in the student application table.
   * @param locationId location that is completing the PIR.
   * @param applicationId application id to be updated.
   * @param payload contains the offering id to be updated in the student application.
   */
  @HasLocationAccess("locationId")
  @Patch(":locationId/program-info-request/application/:applicationId/complete")
  async completeProgramInfoRequest(
    @Param("locationId") locationId: number,
    @Param("applicationId") applicationId: number,
    @Body() payload: CompleteProgramInfoRequestDto,
  ): Promise<void> {
    const submissionResult = await this.formService.dryRunSubmission(
      FormNames.ProgramInformationRequest,
      payload,
    );

    if (!submissionResult.valid) {
      throw new BadRequestException(
        "Not able to complete the Program Information Request due to an invalid request.",
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
      // Offering does not exists and it is going to be created and
      // associated with the application to complete the PIR.
      offeringToCompletePIR = new EducationProgramOffering();
      // While completing a PIR the offering must have dates and costs.
      offeringToCompletePIR.lacksStudyDates = false;
      offeringToCompletePIR.lacksFixedCosts = false;
      offeringToCompletePIR.name = payload.offeringName;
      offeringToCompletePIR.offeringType = payload.offeringType;
      offeringToCompletePIR.studyStartDate = payload.studyStartDate;
      offeringToCompletePIR.studyEndDate = payload.studyEndDate;
      offeringToCompletePIR.breakStartDate = payload.breakStartDate;
      offeringToCompletePIR.breakEndDate = payload.breakEndDate;
      offeringToCompletePIR.actualTuitionCosts = payload.actualTuitionCosts;
      offeringToCompletePIR.programRelatedCosts = payload.programRelatedCosts;
      offeringToCompletePIR.mandatoryFees = payload.mandatoryFees;
      offeringToCompletePIR.exceptionalExpenses = payload.exceptionalExpenses;
      offeringToCompletePIR.tuitionRemittanceRequestedAmount =
        payload.tuitionRemittanceRequestedAmount;
      offeringToCompletePIR.offeringDelivered = payload.offeringDelivered;
      offeringToCompletePIR.lacksStudyBreaks = payload.lacksStudyBreaks;
      offeringToCompletePIR.tuitionRemittanceRequested =
        payload.tuitionRemittanceRequested;
      offeringToCompletePIR.educationProgram = {
        id: payload.selectedProgram,
      } as EducationProgram;
      offeringToCompletePIR.institutionLocation = {
        id: locationId,
      } as InstitutionLocation;
    }

    try {
      const updatedApplication =
        await this.applicationService.setOfferingForProgramInfoRequest(
          applicationId,
          locationId,
          offeringToCompletePIR,
        );

      // Send a message to allow the workflow to proceed.
      //await this.workflowService.sendProgramInfoCompletedMessage(
      //  updatedApplication.assessmentWorkflowId,
      //);
    } catch (error) {
      if (error.name === PIR_REQUEST_NOT_FOUND_ERROR) {
        throw new UnprocessableEntityException(error.message);
      }

      throw new InternalServerErrorException(
        "Error while completing a Program Information Request (PIR).",
      );
    }
  }

  /**
   * Get all application of a location in a institution
   * with Program Info Request (PIR) status completed and required
   * @param locationId location that is completing the PIR.
   * @returns student application list of a institution location
   */
  @AllowAuthorizedParty(AuthorizedParties.institution)
  @HasLocationAccess("locationId")
  @Get(":locationId/program-info-request")
  async getPIRSummary(
    @Param("locationId") locationId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<PIRSummaryDTO[]> {
    const institutionDetails =
      await this.institutionService.getInstituteByUserName(userToken.userName);
    const requestedLoc = await this.locationService.getInstitutionLocationById(
      locationId,
    );
    if (!institutionDetails) {
      throw new UnprocessableEntityException(
        "Not able to find a institution associated with the current user name.",
      );
    }
    if (institutionDetails.id !== requestedLoc.institution.id) {
      throw new ForbiddenException();
    }
    const applications = await this.applicationService.getPIRApplications(
      locationId,
    );
    return applications.map((eachApplication: Application) => {
      return {
        applicationNumber: eachApplication?.applicationNumber,
        applicationNumberId: eachApplication.id,
        studyStartPeriod: eachApplication?.offering?.studyStartDate ?? "",
        studyEndPeriod: eachApplication?.offering?.studyEndDate ?? "",
        pirStatus: eachApplication?.pirStatus,
        firstName: eachApplication?.student?.user?.firstName,
        lastName: eachApplication?.student?.user?.lastName,
      };
    }) as PIRSummaryDTO[];
  }
}
