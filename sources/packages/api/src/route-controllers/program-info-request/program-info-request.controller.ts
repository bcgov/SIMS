import {
  Controller,
  Patch,
  Param,
  Body,
  UnauthorizedException,
  UnprocessableEntityException,
  InternalServerErrorException,
  Get,
  ForbiddenException,
} from "@nestjs/common";
import { CompleteProgramInfoRequestDto } from "./models/program-info-request.dto";
import { HasLocationAccess, AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  ApplicationService,
  EducationProgramOfferingService,
  WorkflowActionsService,
  PIR_REQUEST_NOT_FOUND_ERROR,
  InstitutionService,
  InstitutionLocationService,
} from "../../services";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import { LocationsApplicationDTO } from "../application/models/application.model";
import { Application } from "../../database/entities";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("institution/location")
export class ProgramInfoRequestController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly workflowService: WorkflowActionsService,
    private readonly offeringService: EducationProgramOfferingService,
    private readonly institutionService: InstitutionService,
    private readonly locationService: InstitutionLocationService,
  ) {}

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

  /**
   * Get all application of a location in a institution
   * with Program Info Request (PIR) status completed and required
   * @param locationId location that is completing the PIR.
   * @returns student application list of a institution location
   */
  @AllowAuthorizedParty(AuthorizedParties.institution)
  @HasLocationAccess("locationId")
  @Get(":locationId/pir-summary")
  async getPIRSummary(
    @Param("locationId") locationId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<LocationsApplicationDTO[]> {
    const institutionDetails =
      await this.institutionService.getInstituteByUserName(userToken.userName);
    const requestedLoc = await this.locationService.getInstitutionLocationById(
      locationId,
    );
    if (institutionDetails.id !== requestedLoc.institution.id) {
      throw new ForbiddenException();
    }
    if (!institutionDetails) {
      throw new UnprocessableEntityException(
        "Not able to find a institution associated with the current user name.",
      );
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
    }) as LocationsApplicationDTO[];
  }
}
