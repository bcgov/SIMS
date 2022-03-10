import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  UnprocessableEntityException,
} from "@nestjs/common";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  IsInstitutionAdmin,
  UserToken,
} from "../../auth/decorators";
import { DesignationAgreementService, FormService } from "../../services";
import { getUTCNow } from "../../utilities";
import {
  GetDesignationAgreementDto,
  GetDesignationAgreementsDto,
  SubmitDesignationAgreementDto,
} from "./models/designation-agreement.model";
import { InstitutionUserRoles } from "../../auth/user-types.enum";
import { FormNames } from "../../services/form/constants";
import { DesignationAgreementControllerService } from "./designation-agreement.controller.service";
import { ApiTags } from "@nestjs/swagger";
/***
 * Designation agreement dedicated controller for Institution.
 * */
@AllowAuthorizedParty(AuthorizedParties.institution)
@IsInstitutionAdmin()
@Controller("designation-agreement")
@ApiTags("institution")
export class DesignationAgreementInstitutionsController {
  constructor(
    private readonly designationAgreementService: DesignationAgreementService,
    private readonly formService: FormService,
    private readonly designationAgreementControllerService: DesignationAgreementControllerService,
  ) {}

  /**
   * Initiates a new designation agreement request. This action
   * is meant to me initiated by the institution signing officer
   * for further assessment of the Ministry.
   * @returns the new designation agreement id created.
   */
  @Post()
  async submitDesignationAgreement(
    @UserToken() userToken: IInstitutionUserToken,
    @Body() payload: SubmitDesignationAgreementDto,
  ) {
    // Validates if the user has the right role.
    const isLegalSigningAuthority = userToken.authorizations.hasAdminRole(
      InstitutionUserRoles.legalSigningAuthority,
    );
    if (!isLegalSigningAuthority) {
      throw new ForbiddenException(
        "User does not have the rights to create a designation agreement.",
      );
    }
    // Validate the dynamic data submission.
    const submissionResult = await this.formService.dryRunSubmission(
      FormNames.DesignationAgreementDetails,
      payload,
    );
    if (!submissionResult.valid) {
      throw new BadRequestException(
        "Not able to create a designation agreement due to an invalid request.",
      );
    }

    const hasPendingDesignation =
      await this.designationAgreementService.hasPendingDesignation(
        userToken.authorizations.institutionId,
      );
    if (hasPendingDesignation) {
      throw new UnprocessableEntityException(
        "Institution already has a pending designation agreement.",
      );
    }

    // Creates the designation agreement.
    const createdDesignation =
      await this.designationAgreementService.submitDesignationAgreement(
        userToken.authorizations.institutionId,
        payload.dynamicData,
        userToken.userId,
        getUTCNow(),
        payload.locations
          .filter((location) => location.requestForDesignation)
          .map((location) => location.locationId),
      );
    return createdDesignation.id;
  }

  /**
   * Retrieve the designation agreement information and
   * the associated locations approvals.
   * @param userToken user information.
   * @param designationId designation id.
   * @returns  designation agreement information.
   */
  @Get(":designationId")
  async getDesignationAgreement(
    @UserToken() userToken: IInstitutionUserToken,
    @Param("designationId") designationId: number,
  ): Promise<GetDesignationAgreementDto> {
    return this.designationAgreementControllerService.getDesignationAgreement(
      designationId,
      userToken.authorizations.institutionId,
    );
  }

  /**
   * Get the list of all the designations that belongs to
   * the institution user currently authenticated.
   * @param userToken user authentication token.
   * @returns the list of all the designations that
   * belongs to one the institution.
   */
  @Get()
  async getDesignationAgreements(
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<GetDesignationAgreementsDto[]> {
    return this.designationAgreementControllerService.getDesignationAgreements(
      userToken.authorizations.institutionId,
    );
  }
}
