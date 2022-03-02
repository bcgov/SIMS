import {
  Controller,
  Get,
  Param,
  NotFoundException,
  Patch,
  Body,
} from "@nestjs/common";
import { DesignationAgreementService } from "../../services";
import { DesignationAgreementStatus } from "../../database/entities";
import { getISODateOnlyString } from "../../utilities";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups, UserToken } from "../../auth/decorators";
import { IUserToken } from "../../auth/userToken.interface";
import { UserGroups } from "../../auth/user-groups.enum";
import {
  GetDesignationAgreementDto,
  GetDesignationAgreementsDto,
  PendingDesignationDto,
  UpdateDesignationDto,
} from "./models/designation-agreement.model";
import { DesignationAgreementServiceController } from "./designation-agreement.service.controller";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("designation-agreement")
export class DesignationAgreementAESTController {
  constructor(
    private readonly designationAgreementServiceController: DesignationAgreementServiceController,
    private readonly designationAgreementService: DesignationAgreementService,
  ) {}

  /**
   * Retrieve the designation agreement information and
   * the associated locations approvals.
   * @param designationId
   * @returns designation agreement information.
   */
  @Get(":designationId")
  async getDesignationAgreement(
    @Param("designationId") designationId: number,
  ): Promise<GetDesignationAgreementDto> {
    return this.designationAgreementServiceController.getDesignationAgreement(
      designationId,
    );
  }

  /**
   * Get the list of all the designations that belongs to
   * the institution.
   * @param institutionId
   * @returns the list of all the designations that
   * belongs to the institution.
   */
  @Get("institution/:institutionId")
  async getDesignationAgreements(
    @Param("institutionId") institutionId: number,
  ): Promise<GetDesignationAgreementsDto[]> {
    return this.designationAgreementServiceController.getDesignationAgreements(
      institutionId,
    );
  }

  /**
   * API to retrieve all pending designations.
   * @param designationStatus
   * @returns Pending designations.
   */
  @Get("status/:designationStatus")
  async getPendingDesignationAgreements(
    @Param("designationStatus") designationStatus: DesignationAgreementStatus,
  ): Promise<PendingDesignationDto[]> {
    if (
      !Object.values(DesignationAgreementStatus).includes(designationStatus)
    ) {
      throw new NotFoundException("Invalid designation agreement status.");
    }
    const pendingDesignations =
      await this.designationAgreementService.getAllPendingDesignations(
        designationStatus,
      );
    return pendingDesignations.map(
      (pendingDesignation) =>
        ({
          designationId: pendingDesignation.id,
          designationStatus: pendingDesignation.designationStatus,
          submittedDate: pendingDesignation.submittedDate,
          startDate: getISODateOnlyString(pendingDesignation.startDate),
          endDate: getISODateOnlyString(pendingDesignation.endDate),
          institutionName: pendingDesignation.institution.legalOperatingName,
        } as PendingDesignationDto),
    );
  }

  /**
   * Update designation for Approval/Denial or re-approve by ministry(AEST).
   * @param designationId
   * @param payload Designation which is going to be updated.
   * @param userToken
   */
  @Patch(":designationId")
  async updateDesignationAgreement(
    @Param("designationId") designationId: number,
    @Body() payload: UpdateDesignationDto,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    const designationExist =
      this.designationAgreementService.designationExist(designationId);
    if (!designationExist) {
      throw new NotFoundException("Designation agreement not found.");
    }
    await this.designationAgreementService.updateDesignation(
      designationId,
      userToken.userId,
      payload,
    );
  }
}
