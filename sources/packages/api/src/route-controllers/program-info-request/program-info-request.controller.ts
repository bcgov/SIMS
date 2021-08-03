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
  EducationProgramService,
} from "../../services";
import { getUserFullName } from "../../utilities/auth-utils";
import { ProgramInfoStatus } from "src/database/entities";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("institution/location")
export class ProgramInfoRequestController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly workflowService: WorkflowActionsService,
    private readonly offeringService: EducationProgramOfferingService,
    private readonly programService: EducationProgramService,
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

    // TODO: Create program_id on applications table and populate it
    // from worflow when setting PIR data.
    let studentSelectedProgram = "";
    if (application.data.selectedProgram) {
      const program = await this.programService.findById(
        +application.data.selectedProgram,
      );
      studentSelectedProgram = program.name;
    }

    return {
      institutionLocationName: application.location.name,
      applicationNumber: application.applicationNumber,
      studentFullName: getUserFullName(application.student.user),
      studentSelectedProgram: studentSelectedProgram,
      studentCustomProgram: application.data.programName,
      studentCustomProgramDescription: application.data.programDescription,
      studentStudyStartDate: application.data.studystartDate,
      studentStudyEndDate: application.data.studyendDate,
      selectedProgram: +application.data.selectedProgram,
      selectedOffering: application?.offering?.id,
    };
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
    // Check if the offering belongs to the location.
    const offeringLocationId = await this.offeringService.getOfferingLocationId(
      payload.offeringId,
    );
    if (offeringLocationId !== locationId) {
      throw new UnauthorizedException(
        "The location does not have access to the offering.",
      );
    }

    try {
      const updatedApplication =
        await this.applicationService.setOfferingForProgramInfoRequest(
          applicationId,
          locationId,
          payload.offeringId,
        );

      // Send a message to allow the workflow to proceed.
      await this.workflowService.sendProgramInfoCompletedMessage(
        updatedApplication.assessmentWorkflowId,
      );
    } catch (error) {
      if (error.name === PIR_REQUEST_NOT_FOUND_ERROR) {
        throw new UnprocessableEntityException(error.message);
      }

      throw new InternalServerErrorException(
        "Error while completing a Program Information Request (PIR).",
      );
    }
  }
}
