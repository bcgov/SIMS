import {
  Body,
  Controller,
  Patch,
  Get,
  Post,
  UnprocessableEntityException,
} from "@nestjs/common";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  IsInstitutionAdmin,
  RequiresUserAccount,
  UserToken,
} from "../../auth/decorators";
import { InstitutionService, UserService } from "../../services";
import {
  InstitutionContactAPIInDTO,
  InstitutionDetailAPIOutDTO,
  CreateInstitutionAPIInDTO,
} from "./models/institution.dto";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { ApiTags, ApiUnprocessableEntityResponse } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { InstitutionControllerService } from "./institution.controller.service";
import { ClientTypeBaseRoute } from "../../types";
import { transformAddressDetailsForAddressBlockForm } from "../utils/address-utils";
import { InstitutionLocationAPIOutDTO } from "../institution-locations/models/institution-location.dto";
import { InstitutionLocationControllerService } from "../institution-locations/institution-location.controller.service";
import { OptionItemAPIOutDTO } from "../models/common.dto";

/**
 * Institution controller for institutions Client.
 */
@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("institution")
@ApiTags(`${ClientTypeBaseRoute.Institution}-institution`)
export class InstitutionInstitutionsController extends BaseController {
  constructor(
    private readonly institutionService: InstitutionService,
    private readonly institutionControllerService: InstitutionControllerService,
    private readonly userService: UserService,
    private readonly locationControllerService: InstitutionLocationControllerService,
  ) {
    super();
  }

  /**
   * Creates an institution during institution setup process when the
   * institution profile and the user are created and associated altogether.
   * This process happens only for business BCeID institutions because they
   * are allowed to create the institutions by themselves. Basic BCeID institutions
   * need the Ministry to create the institutions on their behalf and have the basic
   * BCeID users associated as well.
   * @param payload information from the institution and the user.
   * @returns primary identifier of the created resource.
   */
  @ApiUnprocessableEntityResponse({
    description: "Institution user already exist",
  })
  @Post()
  async createInstitutionWithAssociatedUser(
    @Body() payload: CreateInstitutionAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    // Check user exists or not
    const existingUser = await this.userService.getUser(userToken.userName);
    if (existingUser) {
      throw new UnprocessableEntityException("Institution User already exists");
    }

    // Save institution
    const institution =
      await this.institutionService.createInstitutionWithAssociatedUser(
        payload,
        userToken,
      );

    return {
      id: institution.id,
    };
  }

  /**
   * Get institution details of given institution.
   * @returns Institution details.
   */
  @Get()
  async getInstitutionDetail(
    @UserToken() token: IInstitutionUserToken,
  ): Promise<InstitutionDetailAPIOutDTO> {
    const institutionDetail =
      await this.institutionControllerService.getInstitutionDetail(
        token.authorizations.institutionId,
      );

    return {
      ...institutionDetail,
      mailingAddress: transformAddressDetailsForAddressBlockForm(
        institutionDetail.mailingAddress,
      ),
    };
  }

  /**
   * Update institution profile details.
   * @param payload institution details to be updated.
   */
  @IsInstitutionAdmin()
  @Patch()
  async update(
    @Body() payload: InstitutionContactAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<void> {
    await this.institutionService.updateInstitution(
      userToken.authorizations.institutionId,
      userToken.userId,
      payload,
    );
  }

  /**
   * Controller method to get institution locations with designation status for the given institution.
   * @returns Details of all locations of an institution.
   */
  @IsInstitutionAdmin()
  @Get("locations")
  async getAllInstitutionLocations(
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<InstitutionLocationAPIOutDTO[]> {
    // Get all institution locations with designation statuses.
    return this.locationControllerService.getInstitutionLocations(
      userToken.authorizations.institutionId,
    );
  }

  /**
   * Get the list of all institutions types to be returned in an option
   * list (key/value pair) schema.
   * @returns institutions types in an option list (key/value pair) schema.
   */
  @RequiresUserAccount(false)
  @Get("type/options-list")
  async getInstitutionTypeOptions(): Promise<OptionItemAPIOutDTO[]> {
    return this.institutionControllerService.getInstitutionTypeOptions();
  }
}
