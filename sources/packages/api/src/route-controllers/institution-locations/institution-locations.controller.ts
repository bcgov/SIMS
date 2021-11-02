import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UnprocessableEntityException,
  ForbiddenException,
  NotFoundException,
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
import { InstitutionService, ApplicationService } from "../../services";
import {
  HasLocationAccess,
  IsInstitutionAdmin,
  AllowAuthorizedParty,
} from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { OptionItem } from "../../types";
import {
  ActiveApplicationSummaryDTO,
  ActiveApplicationDataDto,
} from "../application/models/application.model";
import { getUserFullName, dateString } from "../../utilities";
import { InstitutionLocation, Application } from "../../database/entities";

@Controller("institution/location")
export class InstitutionLocationsController extends BaseController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly locationService: InstitutionLocationService,
    private readonly formService: FormService,
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
      "institutionlocation",
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
        "Not able to find an institution associated with the current user name.",
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
    // Validate the location data that will be saved to SIMS DB.
    const dryRunSubmissionResult = await this.formService.dryRunSubmission(
      "institutionlocation",
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
    const requestedLoc = await this.locationService.getInstitutionLocationById(
      locationId,
    );
    if (institutionDetails.id !== requestedLoc.institution.id) {
      throw new ForbiddenException();
    }
    if (!institutionDetails) {
      throw new UnprocessableEntityException(
        "Not able to find an associated with the current user name.",
      );
    }
    // If the data is valid the location is updated to SIMS DB.
    const updateResult = await this.locationService.updateLocation(
      locationId,
      institutionDetails.id,
      dryRunSubmissionResult.data.data,
    );
    return updateResult.affected;
  }
  /**
   * Controller method to get institution locations for the given institution.
   * @param userToken
   * @returns All the institution locations for the given institution.
   */
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
        primaryContact: {
          primaryContactFirstName: el.primaryContact.firstName,
          primaryContactLastName: el.primaryContact.lastName,
          primaryContactEmail: el.primaryContact.email,
          primaryContactPhone: el.primaryContact.phoneNumber,
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
   * Get all active application of a location in an institution
   * with application_status is completed.
   * @param locationId location id.
   * @returns Student active application list of an institution location.
   */
  @HasLocationAccess("locationId")
  @Get(":locationId/active-applications")
  async getActiveApplications(
    @Param("locationId") locationId: number,
  ): Promise<ActiveApplicationSummaryDTO[]> {
    const applications = await this.applicationService.getActiveApplications(
      locationId,
    );
    return applications.map((eachApplication: Application) => {
      return {
        applicationNumber: eachApplication.applicationNumber,
        applicationId: eachApplication.id,
        studyStartPeriod: eachApplication.offering?.studyStartDate ?? "",
        studyEndPeriod: eachApplication.offering?.studyEndDate ?? "",
        applicationStatus: eachApplication.applicationStatus,
        fullName: getUserFullName(eachApplication.student.user),
      };
    }) as ActiveApplicationSummaryDTO[];
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
  /**
   * Controller method to retrieve institution location by id.
   * @param locationId
   * @param userToken
   * @returns institution location.
   */
  @AllowAuthorizedParty(AuthorizedParties.institution)
  @HasLocationAccess("locationId")
  @Get(":locationId")
  async getInstitutionLocation(
    @Param("locationId") locationId: number,
    @UserToken() userToken: IUserToken,
  ): Promise<InstitutionLocationTypeDto> {
    //To retrive institution id
    const institutionDetails =
      await this.institutionService.getInstituteByUserName(userToken.userName);
    if (!institutionDetails) {
      throw new UnprocessableEntityException(
        "Not able to find the Location associated.",
      );
    }
    // get all institution locations.
    const institutionLocation: InstitutionLocation =
      await this.locationService.getInstitutionLocation(
        institutionDetails.id,
        locationId,
      );

    return {
      address1: institutionLocation.data.address.addressLine1,
      address2: institutionLocation.data.address.addressLine2,
      city: institutionLocation.data.address.city,
      country: institutionLocation.data.address.country,
      locationName: institutionLocation.name,
      postalZipCode: institutionLocation.data.address.postalCode,
      provinceState: institutionLocation.data.address.province,
      institutionCode: institutionLocation.institutionCode,
      primaryContactFirstName: institutionLocation.primaryContact.firstName,
      primaryContactLastName: institutionLocation.primaryContact.lastName,
      primaryContactEmail: institutionLocation.primaryContact.email,
      primaryContactPhone: institutionLocation.primaryContact.phoneNumber,
    } as InstitutionLocationTypeDto;
  }

  /**
   * Get active application details.
   * @param applicationId application id.
   * @returns application Details
   */
  @AllowAuthorizedParty(AuthorizedParties.institution)
  @HasLocationAccess("locationId")
  @Get(":locationId/active-application/:applicationId")
  async getActiveApplication(
    @Param("locationId") locationId: number,
    @Param("applicationId") applicationId: number,
  ): Promise<ActiveApplicationDataDto> {
    const application = await this.applicationService.getActiveApplication(
      applicationId,
      locationId,
    );
    if (!application) {
      throw new NotFoundException(
        `Application id ${applicationId} was not found.`,
      );
    }
    return {
      applicationStatus: application.applicationStatus,
      applicationNumber: application.applicationNumber,
      applicationOfferingIntensity: application.offering.offeringIntensity,
      applicationOfferingStartDate: dateString(
        application.offering.studyStartDate,
      ),
      applicationOfferingEndDate: dateString(application.offering.studyEndDate),
      applicationLocationName: application.location.name,
      applicationStudentName: getUserFullName(application.student.user),
      applicationOfferingName: application.offering.name,
      applicationProgramDescription:
        application.offering.educationProgram.description,
      applicationProgramName: application.offering.educationProgram.name,
    };
  }
}
