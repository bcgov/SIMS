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
import {
  InstitutionService,
  ApplicationService,
  InstitutionLocationService,
  FormService,
} from "../../services";
import {
  InstitutionLocationsDetailsDto,
  InstitutionLocationTypeDto,
} from "./models/institution-location.dto";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import {
  IInstitutionUserToken,
  IUserToken,
} from "../../auth/userToken.interface";
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
import {
  getUserFullName,
  dateString,
  getISODateOnlyString,
  deliveryMethod,
  credentialTypeToDisplay,
} from "../../utilities";
import { InstitutionLocation, Application } from "../../database/entities";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { InstitutionLocationsControllerService } from "./institution-locations.controller.service";

@Controller("institution/location")
@ApiTags("institution")
export class InstitutionLocationsController extends BaseController {
  constructor(
    private readonly locationControllerService: InstitutionLocationsControllerService,
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
   * Controller method to get institution locations with designation status for the given institution.
   * @param userToken
   * @returns An array of InstitutionLocationsDetailsDto.
   */
  @ApiOkResponse({
    description: "Institution locations with their designation status found.",
  })
  @AllowAuthorizedParty(AuthorizedParties.institution)
  @IsInstitutionAdmin()
  @Get()
  async getAllInstitutionLocations(
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<InstitutionLocationsDetailsDto[]> {
    // get all institution locations with designation statuses.
    return this.locationControllerService.getInstitutionLocations(
      userToken.authorizations.institutionId,
    );
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
      const offering = eachApplication.currentAssessment?.offering;
      return {
        applicationNumber: eachApplication.applicationNumber,
        applicationId: eachApplication.id,
        studyStartPeriod: getISODateOnlyString(offering?.studyStartDate),
        studyEndPeriod: getISODateOnlyString(offering?.studyEndDate),
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
    const locations = await this.locationService.getDesignatedLocations();
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
    //To retrieve institution id
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
      addressLine1: institutionLocation.data.address.addressLine1,
      addressLine2: institutionLocation.data.address.addressLine2,
      city: institutionLocation.data.address.city,
      country: institutionLocation.data.address.country,
      locationName: institutionLocation.name,
      postalCode: institutionLocation.data.address.postalCode,
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
    const offering = application.currentAssessment.offering;
    return {
      applicationStatus: application.applicationStatus,
      applicationNumber: application.applicationNumber,
      applicationOfferingIntensity: offering.offeringIntensity,
      applicationOfferingStartDate: dateString(offering.studyStartDate),
      applicationOfferingEndDate: dateString(offering.studyEndDate),
      applicationLocationName: offering.institutionLocation.name,
      applicationStudentName: getUserFullName(application.student.user),
      applicationOfferingName: offering.name,
      applicationProgramDescription: offering.educationProgram.description,
      applicationProgramName: offering.educationProgram.name,
      applicationProgramCredential: credentialTypeToDisplay(
        offering.educationProgram.credentialType,
      ),
      applicationProgramDelivery: deliveryMethod(
        offering.educationProgram.deliveredOnline,
        offering.educationProgram.deliveredOnSite,
      ),
      applicationOfferingStudyDelivery: offering.offeringDelivered,
      applicationOfferingStudyBreak: offering.studyBreaks.map((studyBreak) => ({
        breakStartDate: dateString(studyBreak.breakStartDate),
        breakEndDate: dateString(studyBreak.breakEndDate),
      })),
      applicationOfferingTuition: offering.actualTuitionCosts,
      applicationOfferingProgramRelatedCosts: offering.programRelatedCosts,
      applicationOfferingMandatoryFess: offering.mandatoryFees,
      applicationOfferingExceptionalExpenses: offering.exceptionalExpenses,
    };
  }
}
