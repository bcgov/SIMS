import {
  Controller,
  Get,
  Param,
  NotFoundException,
  Patch,
  Body,
  Query,
  BadRequestException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  DesignationAgreementService,
  FormService,
  InstitutionLocationService,
} from "../../services";
import { FormNames } from "../../services/form/constants";
import { DesignationAgreementStatus } from "../../database/entities";
import { getISODateOnlyString, PaginationParams } from "../../utilities";
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
import { DesignationAgreementControllerService } from "./designation-agreement.controller.service";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("designation-agreement")
@ApiTags("designation-agreement")
export class DesignationAgreementAESTController extends BaseController {
  constructor(
    private readonly designationAgreementControllerService: DesignationAgreementControllerService,
    private readonly designationAgreementService: DesignationAgreementService,
    private readonly formService: FormService,
    private readonly institutionLocationService: InstitutionLocationService,
  ) {
    super();
  }

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
    return this.designationAgreementControllerService.getDesignationAgreement(
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
    return this.designationAgreementControllerService.getDesignationAgreements(
      institutionId,
    );
  }

  /**
   * API to retrieve all designations by status.
   * @param designationStatus
   * @param searchCriteria to search designation.
   * @returns Pending designations.
   */
  @Get("status/:designationStatus")
  async getDesignationAgreementByStatus(
    @Param("designationStatus") designationStatus: DesignationAgreementStatus,
    @Query(PaginationParams.SearchCriteria) searchCriteria: string,
  ): Promise<PendingDesignationDto[]> {
    if (
      !Object.values(DesignationAgreementStatus).includes(designationStatus)
    ) {
      throw new NotFoundException("Invalid designation agreement status.");
    }
    const pendingDesignations =
      await this.designationAgreementService.getDesignationAgreementsByStatus(
        designationStatus,
        searchCriteria,
      );
    return pendingDesignations.map(
      (pendingDesignation) =>
        ({
          designationId: pendingDesignation.id,
          designationStatus: pendingDesignation.designationStatus,
          submittedDate: pendingDesignation.submittedDate,
          startDate: getISODateOnlyString(pendingDesignation.startDate),
          endDate: getISODateOnlyString(pendingDesignation.endDate),
          legalOperatingName: pendingDesignation.institution.legalOperatingName,
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
        this.institutionLocationService.validateInstitutionLocations(
          designation.institution.id,
          locationIds,
        );
      if (!validInstitutionLocations) {
        throw new UnprocessableEntityException(
          "One or more locations provided does not belong to designation institution.",
        );
      }
    }
    const submissionResult = await this.formService.dryRunSubmission(
      FormNames.ApproveDenyDesignations,
      payload,
    );
    if (!submissionResult.valid) {
      throw new BadRequestException(
        "Not able to update designation agreement due to an invalid request.",
      );
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
