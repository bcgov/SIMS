import {
  Controller,
  Get,
  Param,
  NotFoundException,
  Patch,
  Body,
  Query,
  UnprocessableEntityException,
  ParseIntPipe,
  ParseEnumPipe,
} from "@nestjs/common";
import {
  DesignationAgreementService,
  InstitutionLocationService,
} from "../../services";
import { DesignationAgreementStatus } from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  Groups,
  Roles,
  UserToken,
} from "../../auth/decorators";
import { IUserToken } from "../../auth/userToken.interface";
import { UserGroups } from "../../auth/user-groups.enum";
import {
  DesignationAgreementAPIOutDTO,
  DesignationAgreementDetailsAPIOutDTO,
  PendingDesignationAgreementDetailsAPIOutDTO,
  UpdateDesignationAPIInDTO,
  DesignationAgreementSearchAPIInDTO,
} from "./models/designation-agreement.dto";
import { DesignationAgreementControllerService } from "./designation-agreement.controller.service";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import BaseController from "../BaseController";
import { Role } from "../../auth/roles.enum";
import { ClientTypeBaseRoute } from "../../types";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("designation-agreement")
@ApiTags(`${ClientTypeBaseRoute.AEST}-designation-agreement`)
export class DesignationAgreementAESTController extends BaseController {
  constructor(
    private readonly designationAgreementControllerService: DesignationAgreementControllerService,
    private readonly designationAgreementService: DesignationAgreementService,
    private readonly institutionLocationService: InstitutionLocationService,
  ) {
    super();
  }

  /**
   * Retrieve the designation agreement information and
   * the associated locations approvals.
   * @param designationId id of the designation to be retrieved.
   * @returns designation agreement information.
   */
  @Get(":designationId")
  @ApiNotFoundResponse({ description: "Designation agreement not found." })
  async getDesignationAgreement(
    @Param("designationId", ParseIntPipe) designationId: number,
  ): Promise<DesignationAgreementAPIOutDTO> {
    return this.designationAgreementControllerService.getDesignationAgreement(
      designationId,
    );
  }

  /**
   * Get the list of all the designations that belongs to
   * the institution.
   * @param institutionId id of the institution to be retrieved.
   * @returns the list of all the designations that
   * belongs to the institution.
   */
  @Get("institution/:institutionId")
  async getDesignationAgreements(
    @Param("institutionId", ParseIntPipe) institutionId: number,
  ): Promise<DesignationAgreementDetailsAPIOutDTO[]> {
    return this.designationAgreementControllerService.getDesignationAgreements(
      institutionId,
    );
  }

  /**
   * API to retrieve all designations by status.
   * @param designationStatus status to be searched.
   * @param designationAgreementSearch to search designation.
   * @returns Pending designations.
   */
  @Get("status/:designationStatus")
  async getDesignationAgreementByStatus(
    @Param("designationStatus", new ParseEnumPipe(DesignationAgreementStatus))
    designationStatus: DesignationAgreementStatus,
    @Query() designationAgreementSearch: DesignationAgreementSearchAPIInDTO,
  ): Promise<PendingDesignationAgreementDetailsAPIOutDTO[]> {
    const pendingDesignations =
      await this.designationAgreementService.getDesignationAgreementsByStatus(
        designationStatus,
        designationAgreementSearch?.searchCriteria,
      );
    return pendingDesignations.map((pendingDesignation) => ({
      designationId: pendingDesignation.id,
      designationStatus: pendingDesignation.designationStatus,
      submittedDate: pendingDesignation.submittedDate,
      startDate: getISODateOnlyString(pendingDesignation.startDate),
      endDate: getISODateOnlyString(pendingDesignation.endDate),
      legalOperatingName: pendingDesignation.institution.legalOperatingName,
    }));
  }

  /**
   * Update designation for Approval/Denial or re-approve by ministry(AEST).
   * @param designationId id of the designation to be updated.
   * @param payload Designation which is going to be updated.
   */
  @Roles(Role.InstitutionApproveDeclineDesignation)
  @Patch(":designationId")
  @ApiNotFoundResponse({
    description:
      "Designation agreement not found or it has been declined already.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "One or more locations provided do not belong to designation institution.",
  })
  async updateDesignationAgreement(
    @Param("designationId", ParseIntPipe) designationId: number,
    @Body() payload: UpdateDesignationAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    const designation =
      await this.designationAgreementService.getDesignationForUpdate(
        designationId,
      );
    if (!designation) {
      throw new NotFoundException(
        "Designation agreement not found or it has been declined already.",
      );
    }
    if (payload.designationStatus === DesignationAgreementStatus.Approved) {
      const locationIds = payload.locationsDesignations.map(
        (location) => location.locationId,
      );
      const validInstitutionLocations =
        await this.institutionLocationService.validateInstitutionLocations(
          designation.institution.id,
          locationIds,
        );
      if (!validInstitutionLocations) {
        throw new UnprocessableEntityException(
          "One or more locations provided do not belong to designation institution.",
        );
      }
    }
    await this.designationAgreementService.updateDesignation(
      designationId,
      designation.institution.id,
      userToken.userId,
      payload,
      designation.designationAgreementLocations,
    );
  }
}
