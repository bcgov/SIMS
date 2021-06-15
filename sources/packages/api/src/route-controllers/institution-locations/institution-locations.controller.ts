import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UnprocessableEntityException,
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

@AllowAuthorizedParty(AuthorizedParties.institution)
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

    //To retrive institution id
    const institutionDetails =
      await this.institutionService.getInstituteByUserName(userToken.userName);
    if (!institutionDetails) {
      throw new UnprocessableEntityException(
        "Not able to find a institution associated with the current user name.",
      );
    }

    // If the data is valid the location is saved to SIMS DB.
    const createdInstitutionlocation =
      await this.locationService.createtLocation(
        institutionDetails.id,
        dryRunSubmissionResult.data,
      );

    // Save a form to formio to handle the location approval.
    const submissionResult = await this.formService.submission(
      "institutionlocation",
      payload,
    );

    // Create an application entry on FormFlow.ai, using the
    // previously created form definition on formio.
    await this.formsFlowService.createApplication({
      formId: submissionResult.formId,
      formUrl: submissionResult.absolutePath,
      submissionId: submissionResult.submissionId,
    });

    return createdInstitutionlocation.id;
  }

  @HasLocationAccess("locationId")
  @Patch(":locationId")
  async update(
    @Param("locationId") locationId: number,
    @Body() payload: InstitutionLocationTypeDto,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<number> {
    //To retrive institution id
    const institutionDetails =
      await this.institutionService.getInstituteByUserName(userToken.userName);
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

  @Get()
  async getAllInstitutionLocations(
    @UserToken() userToken: IUserToken,
  ): Promise<InstitutionLocationsDetailsDto[]> {
    // TODO: Change to return only the locations that the user has access.
    // It is currently returning all the locations for the inistitution.

    //To retrive institution id
    const institutionDetails =
      await this.institutionService.getInstituteByUserName(userToken.userName);
    if (!institutionDetails) {
      throw new UnprocessableEntityException(
        "Not able to find a institution associated with the current user name.",
      );
    }
    // get all institution locations.
    const InstitutionLocationData =
      await this.locationService.getAllInstitutionlocations(
        institutionDetails.id,
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
