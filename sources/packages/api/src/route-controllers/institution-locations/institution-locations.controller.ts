import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UnprocessableEntityException,
  ForbiddenException,
} from "@nestjs/common";
import BaseController from "../BaseController";
import { InstitutionLocationService, FormService } from "../../services";
import {
  InstitutionLocationsDetailsDto,
  InstitutionLocationTypeDto,
} from "./models/institution-location.dto";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import {
  IInstitutionUserToken,
  IUserToken,
} from "../../auth/userToken.interface";
import { FormsFlowService, InstitutionService } from "../../services";
import {
  HasLocationAccess,
  IsInstitutionAdmin,
  AllowAuthorizedParty,
} from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { InstitutionLocation } from "../../database/entities/institution-location.model";
import { OptionItem } from "../../types";
@Controller("institution/location")
export class InstitutionLocationsController extends BaseController {
  constructor(
    private readonly locationService: InstitutionLocationService,
    private readonly formService: FormService,
    private readonly formsFlowService: FormsFlowService,
    private readonly institutionService: InstitutionService,
  ) {
    super();
  }

  @AllowAuthorizedParty(AuthorizedParties.institution)
  @IsInstitutionAdmin()
  @Post()
  async create(
    @Body() payload: InstitutionLocationTypeDto,
    @UserToken() userToken: IUserToken,
  ): Promise<number> {
    // Validate the location data that will be saved to SIMS DB.
    const dryRunSubmissionResult = await this.formService.dryRunSubmission(
      "institutionlocationcreation",
      payload,
    );

    if (!dryRunSubmissionResult.valid) {
      throw new UnprocessableEntityException(
        "Not able to create the institution location due to an invalid request.",
      );
    }

    //To retrieve institution id
    const institutionDetails =
      await this.institutionService.getInstituteByUserName(userToken.userName);
    if (!institutionDetails) {
      throw new UnprocessableEntityException(
        "Not able to find a institution associated with the current user name.",
      );
    }

    // If the data is valid the location is saved to SIMS DB.
    const createdInstitutionLocation =
      await this.locationService.createLocation(
        institutionDetails.id,
        dryRunSubmissionResult.data,
      );

    return createdInstitutionLocation.id;
  }

  @AllowAuthorizedParty(AuthorizedParties.institution)
  @IsInstitutionAdmin()
  @Patch(":locationId")
  async update(
    @Param("locationId") locationId: number,
    @Body() payload: InstitutionLocationTypeDto,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<number> {
    //To retrieve institution id
    const institutionDetails =
      await this.institutionService.getInstituteByUserName(userToken.userName);
    const requestedLoc = await this.locationService.getInstitutionLocationById(
      locationId,
    );
    if (institutionDetails.id !== requestedLoc.institution.id) {
      throw new ForbiddenException();
    }
    if (!institutionDetails) {
      throw new UnprocessableEntityException(
        "Not able to find a institution associated with the current user name.",
      );
    }
    // If the data is valid the location is updated to SIMS DB.
    const updateResult = await this.locationService.updateLocation(
      locationId,
      institutionDetails.id,
      payload,
    );
    return updateResult.affected;
  }

  @AllowAuthorizedParty(AuthorizedParties.institution)
  @IsInstitutionAdmin()
  @Get()
  async getAllInstitutionLocations(
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<InstitutionLocationsDetailsDto[]> {
    // get all institution locations.
    const InstitutionLocationData =
      await this.locationService.getAllInstitutionLocations(
        userToken.authorizations.institutionId,
      );
    return InstitutionLocationData.map((el: InstitutionLocation) => {
      return {
        id: el.id,
        name: el.name,
        data: {
          address: {
            addressLine1: el.data.address?.addressLine1,
            addressLine2: el.data.address?.addressLine2,
            province: el.data.address?.province,
            country: el.data.address?.country,
            city: el.data.address?.city,
            postalCode: el.data.address?.postalCode,
          },
        },
        institution: {
          institutionPrimaryContact: {
            primaryContactEmail:
              el.institution.institutionPrimaryContact.primaryContactEmail,
            primaryContactFirstName:
              el.institution.institutionPrimaryContact.primaryContactFirstName,
            primaryContactLastName:
              el.institution.institutionPrimaryContact.primaryContactLastName,
            primaryContactPhone:
              el.institution.institutionPrimaryContact.primaryContactPhone,
          },
        },
      } as InstitutionLocationsDetailsDto;
    });
  }

  /**
   * Get a key/value pair list of all locations
   * from all institution available.
   * @returns key/value pair list of all locations.
   */
  @AllowAuthorizedParty(AuthorizedParties.student)
  @Get("options-list")
  async getOptionsList(): Promise<OptionItem[]> {
    const locations = await this.locationService.getLocations();
    return locations.map((location) => ({
      id: location.id,
      description: location.name,
    }));
  }

  @AllowAuthorizedParty(AuthorizedParties.institution)
  @HasLocationAccess("locationId")
  @Get(":locationId")
  async getInstitutionLocation(
    @Param("locationId") locationId: number,
    @UserToken() userToken: IUserToken,
  ): Promise<InstitutionLocation> {
    //To retrive institution id
    const institutionDetails =
      await this.institutionService.getInstituteByUserName(userToken.userName);
    if (!institutionDetails) {
      throw new UnprocessableEntityException(
        "Not able to find the Location associated.",
      );
    }
    // get all institution locations.
    return this.locationService.getInstitutionLocation(
      institutionDetails.id,
      locationId,
    );
  }
}
