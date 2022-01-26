import { Body, Controller, Post } from "@nestjs/common";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, UserToken } from "../../auth/decorators";
import { DesignationAgreementService } from "../../services";
import { getUTCNow } from "../../utilities";
import { SubmitDesignationAgreementDto } from "./models/designation-agreement.model";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("institution/designation-agreement")
export class DesignationAgreementController {
  constructor(
    private readonly designationAgreementService: DesignationAgreementService,
  ) {}

  /**
   * Initiates a new designation agreement request. This action
   * is meant to me initiated by the institution signing officer
   * for further assessment of the Ministry.
   * @param institutionId institution id requesting the designation.
   * @returns the new designation agreement id created.
   */
  @Post()
  async getSummary(
    @UserToken() userToken: IInstitutionUserToken,
    @Body() payload: SubmitDesignationAgreementDto,
  ) {
    const createdDesignation =
      await this.designationAgreementService.submitDesignationAgreement(
        payload.institutionId,
        payload.submittedData,
        userToken.userId,
        getUTCNow(),
        payload.requestedLocationsIds,
      );
    return createdDesignation.id;
  }
}
