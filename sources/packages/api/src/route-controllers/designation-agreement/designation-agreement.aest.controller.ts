import { Controller, Get, Param } from "@nestjs/common";
import { DesignationAgreementService } from "../../services";
import { getISODateOnlyString } from "../../utilities";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import {
  GetDesignationAgreementDto,
  GetDesignationAgreementsDto,
  PendingDesignationDto,
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
   * @returns Pending designations.
   */
  @Get("status/pending")
  async getPendingDesignationAgreements(): Promise<PendingDesignationDto[]> {
    const pendingDesignations =
      await this.designationAgreementService.getAllPendingDesignations();
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
}
