import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
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
import {
  DesignationAgreementService,
  FormService,
  InstitutionService,
} from "../../services";
import {
  DesignationAgreementAPIOutDTO,
  DesignationAgreementDetailsAPIOutDTO,
  SubmitDesignationAgreementAPIInDTO,
} from "./models/designation-agreement.dto";
import { InstitutionUserRoles } from "../../auth/user-types.enum";
import { FormNames } from "../../services/form/constants";
import { DesignationAgreementControllerService } from "./designation-agreement.controller.service";
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute } from "../../types";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";

/***
 * Designation agreement dedicated controller for Institution.
 * */
@AllowAuthorizedParty(AuthorizedParties.institution)
@IsInstitutionAdmin()
@Controller("designation-agreement")
@ApiTags(`${ClientTypeBaseRoute.Institution}-designation-agreement`)
export class DesignationAgreementInstitutionsController extends BaseController {
  constructor(
    private readonly designationAgreementService: DesignationAgreementService,
    private readonly formService: FormService,
    private readonly institutionService: InstitutionService,
    private readonly designationAgreementControllerService: DesignationAgreementControllerService,
  ) {
    super();
  }

  /**
   * Initiates a new designation agreement request. This action
   * is meant to me initiated by the institution signing officer
   * for further assessment of the Ministry.
   * @returns the new designation agreement id created.
   */
  @Post()
  @ApiForbiddenResponse({
    description:
      "User does not have the rights to create a designation agreement.",
  })
  @ApiBadRequestResponse({
    description:
      "Not able to create a designation agreement due to an invalid request.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "Your institution already has one pending designation request; you cannot submit another one until the first has been approved or denied.",
  })
  async submitDesignationAgreement(
    @UserToken() userToken: IInstitutionUserToken,
    @Body() payload: SubmitDesignationAgreementAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    // Validates if the user has the right role.
    const isLegalSigningAuthority = userToken.authorizations.hasAdminRole(
      InstitutionUserRoles.legalSigningAuthority,
    );
    if (!isLegalSigningAuthority) {
      throw new ForbiddenException(
        "User does not have the rights to create a designation agreement.",
      );
    }

    // Check if institution is private and append it to the payload.
    const { institutionType } =
      await this.institutionService.getInstitutionTypeById(
        userToken.authorizations.institutionId,
      );
    payload.isBCPrivate = institutionType.isBCPrivate;

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
        "Your institution already has one pending designation request; you cannot submit another one until the first has been approved or denied.",
      );
    }

    // Creates the designation agreement.
    const createdDesignation =
      await this.designationAgreementService.submitDesignationAgreement(
        userToken.authorizations.institutionId,
        submissionResult.data.data.dynamicData,
        userToken.userId,
        payload.locations
          .filter((location) => location.requestForDesignation)
          .map((location) => location.locationId),
      );
    return { id: createdDesignation.id };
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
    @Param("designationId", ParseIntPipe) designationId: number,
  ): Promise<DesignationAgreementAPIOutDTO> {
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
  ): Promise<DesignationAgreementDetailsAPIOutDTO[]> {
    return this.designationAgreementControllerService.getDesignationAgreements(
      userToken.authorizations.institutionId,
    );
  }
}
