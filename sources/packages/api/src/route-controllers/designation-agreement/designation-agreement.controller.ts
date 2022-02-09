import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
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
  SubmitDesignationAgreementDto,
} from "./models/designation-agreement.model";
import { InstitutionUserRoles } from "../../auth/user-types.enum";
import { FormNames } from "../../services/form/constants";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("institution/designation-agreement")
export class DesignationAgreementController {
  constructor(
    private readonly designationAgreementService: DesignationAgreementService,
    private readonly formService: FormService,
  ) {}

  /**
   * Initiates a new designation agreement request. This action
   * is meant to me initiated by the institution signing officer
   * for further assessment of the Ministry.
   * @returns the new designation agreement id created.
   */
  @IsInstitutionAdmin()
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
  @IsInstitutionAdmin()
  @Get(":designationId")
  async getDesignationAgreement(
    @UserToken() userToken: IInstitutionUserToken,
    @Param("designationId") designationId: number,
  ): Promise<GetDesignationAgreementDto> {
    const designation =
      await this.designationAgreementService.getInstitutionDesignationById(
        designationId,
        userToken.authorizations.institutionId,
      );
    if (!designation) {
      throw new NotFoundException("Designation agreement not found.");
    }

    return {
      designationId: designation.id,
      designationStatus: designation.designationStatus,
      submittedData: designation.submittedData,
      locationsDesignations: designation.designationAgreementLocations.map(
        (agreementLocation) => ({
          locationId: agreementLocation.institutionLocation.id,
          locationName: agreementLocation.institutionLocation.name,
          locationData: agreementLocation.institutionLocation.data,
          requested: agreementLocation.requested,
          approved: agreementLocation.approved,
        }),
      ),
    } as GetDesignationAgreementDto;
  }
}
