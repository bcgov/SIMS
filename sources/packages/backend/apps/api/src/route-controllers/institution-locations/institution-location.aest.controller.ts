import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { InstitutionLocationService } from "../../services";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  Groups,
  Roles,
  UserToken,
} from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import { IUserToken } from "../../auth/userToken.interface";
import { ClientTypeBaseRoute, ApiProcessError } from "../../types";
import BaseController from "../BaseController";
import { InstitutionLocationControllerService } from "./institution-location.controller.service";
import {
  AESTInstitutionLocationAPIInDTO,
  InstitutionLocationDetailsAPIOutDTO,
} from "./models/institution-location.dto";
import { Role } from "../../auth/roles.enum";
import { CustomNamedError } from "@sims/utilities";
import { DUPLICATE_INSTITUTION_LOCATION_CODE } from "../../constants";

/**
 * Institution location controller for institutions Client.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("location")
@ApiTags(`${ClientTypeBaseRoute.AEST}-location`)
export class InstitutionLocationAESTController extends BaseController {
  constructor(
    private readonly locationControllerService: InstitutionLocationControllerService,
    private readonly locationService: InstitutionLocationService,
  ) {
    super();
  }

  /**
   * Controller method to retrieve institution location by id.
   * @param locationId
   * @returns institution location.
   */
  @Get(":locationId")
  @ApiNotFoundResponse({ description: "Institution Location not found." })
  async getInstitutionLocation(
    @Param("locationId", ParseIntPipe) locationId: number,
  ): Promise<InstitutionLocationDetailsAPIOutDTO> {
    // Get particular institution location.
    return this.locationControllerService.getInstitutionLocation(locationId);
  }

  /**
   * Update an institution location.
   * @param locationId
   * @param payload
   */
  @ApiUnprocessableEntityResponse({
    description: "Duplicate institution location code.",
  })
  @Roles(Role.InstitutionEditLocationDetails)
  @Patch(":locationId")
  async update(
    @Param("locationId", ParseIntPipe) locationId: number,
    @Body() payload: AESTInstitutionLocationAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    try {
      await this.locationService.updateLocation(
        payload,
        locationId,
        userToken.userId,
      );
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        if (error.name === DUPLICATE_INSTITUTION_LOCATION_CODE) {
          throw new UnprocessableEntityException(
            new ApiProcessError(error.message, error.name),
          );
        }
      }
      throw error;
    }
  }
}
