import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseBoolPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiTags,
} from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import {
  AllowAuthorizedParty,
  HasLocationAccess,
  IsInstitutionAdmin,
  UserToken,
} from "../../auth/decorators";
import {
  ApplicationService,
  FormService,
  InstitutionLocationService,
} from "../../services";
import { ClientTypeBaseRoute } from "../../types";
import { getISODateOnlyString, getUserFullName } from "../../utilities";
import {
  ActiveApplicationDataAPIOutDTO,
  ActiveApplicationSummaryAPIOutDTO,
  transformToActiveApplicationDataAPIOutDTO,
} from "./models/application.dto";
import BaseController from "../BaseController";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import {
  InstitutionLocationPrimaryContactAPIInDTO,
  InstitutionLocationFormAPIInDTO,
  InstitutionLocationDetailsAPIOutDTO,
  InstitutionLocationsAPIOutDTO,
} from "./models/institution-location.dto";
import { FormNames } from "../../services/form/constants";
import { transformAddressDetailsForAddressBlockForm } from "../utils/address-utils";
import {
  ApplicationStatusPaginationOptionsAPIInDTO,
  PaginatedResultsAPIOutDTO,
} from "../models/pagination.dto";

/**
 * Institution location controller for institutions Client.
 */
@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("location")
@ApiTags(`${ClientTypeBaseRoute.Institution}-location`)
export class InstitutionLocationInstitutionsController extends BaseController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly locationService: InstitutionLocationService,
    private readonly formService: FormService,
  ) {
    super();
  }

  /**
   * Create an Institution location.
   * @param payload
   * @returns Primary identifier of created location.
   */
  @ApiBadRequestResponse({
    description: "Invalid request to create an institution location.",
  })
  @IsInstitutionAdmin()
  @Post()
  async create(
    @Body() payload: InstitutionLocationFormAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    // Validate the location data that will be saved to SIMS DB.
    const dryRunSubmissionResult = await this.formService.dryRunSubmission(
      FormNames.InstitutionLocation,
      payload,
    );

    if (!dryRunSubmissionResult.valid) {
      throw new BadRequestException(
        "Not able to create the institution location due to an invalid request.",
      );
    }

    // If the data is valid the location is saved to SIMS DB.
    const createdInstitutionLocation = await this.locationService.saveLocation(
      userToken.authorizations.institutionId,
      dryRunSubmissionResult.data.data,
      userToken.userId,
    );

    return { id: createdInstitutionLocation.id };
  }

  /**
   * Update an institution location.
   * @param locationId
   * @param payload
   */
  @HasLocationAccess("locationId")
  @IsInstitutionAdmin()
  @Patch(":locationId")
  async update(
    @Param("locationId") locationId: number,
    @Body() payload: InstitutionLocationPrimaryContactAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<void> {
    await this.locationService.updateLocationPrimaryContact(
      payload,
      locationId,
      userToken.userId,
    );
  }

  /**
   * Get all active application of a location in an institution
   * with application_status is completed.
   * @param locationId location id.
   * @param pagination options to execute the pagination.
   * @param archived archive value of applications requested by user.
   * @returns Student active application list of an institution location.
   */
  @HasLocationAccess("locationId")
  @Get(":locationId/active-applications")
  async getActiveApplications(
    @Param("locationId") locationId: number,
    @Query() pagination: ApplicationStatusPaginationOptionsAPIInDTO,
    @Query("archived", ParseBoolPipe) archived: boolean,
  ): Promise<PaginatedResultsAPIOutDTO<ActiveApplicationSummaryAPIOutDTO>> {
    const applications = await this.applicationService.getActiveApplications(
      locationId,
      pagination,
      archived,
    );

    return {
      results: applications.results.map((eachApplication) => {
        const offering = eachApplication.currentAssessment?.offering;
        return {
          applicationNumber: eachApplication.applicationNumber,
          applicationId: eachApplication.id,
          studyStartPeriod: getISODateOnlyString(offering?.studyStartDate),
          studyEndPeriod: getISODateOnlyString(offering?.studyEndDate),
          applicationStatus: eachApplication.applicationStatus,
          applicationScholasticStandingStatus:
            this.applicationService.getApplicationScholasticStandingStatus(
              eachApplication.isArchived,
              eachApplication.currentAssessment?.studentScholasticStanding?.id,
            ),
          fullName: getUserFullName(eachApplication.student.user),
          scholasticStandingId:
            eachApplication.currentAssessment?.studentScholasticStanding?.id,
        };
      }),
      count: applications.count,
    };
  }

  /**
   * Controller method to retrieve institution location by id.
   * @param locationId
   * @param userToken
   * @returns institution location.
   */
  @HasLocationAccess("locationId")
  @Get(":locationId")
  @ApiNotFoundResponse({ description: "Institution Location not found." })
  async getInstitutionLocation(
    @Param("locationId") locationId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<InstitutionLocationDetailsAPIOutDTO> {
    // Get particular institution location.
    const institutionLocation =
      await this.locationService.getInstitutionLocation(
        locationId,
        userToken.authorizations.institutionId,
      );

    return {
      locationName: institutionLocation.name,
      institutionCode: institutionLocation.institutionCode,
      primaryContactFirstName: institutionLocation.primaryContact.firstName,
      primaryContactLastName: institutionLocation.primaryContact.lastName,
      primaryContactEmail: institutionLocation.primaryContact.email,
      primaryContactPhone: institutionLocation.primaryContact.phone,
      ...transformAddressDetailsForAddressBlockForm(
        institutionLocation.data.address,
      ),
    };
  }

  /**
   * Get active application details.
   * @param locationId location id.
   * @param applicationId application id.
   * @returns active application Details
   */
  @ApiNotFoundResponse({ description: "Application not found." })
  @HasLocationAccess("locationId")
  @Get(":locationId/active-application/:applicationId")
  async getActiveApplication(
    @Param("locationId") locationId: number,
    @Param("applicationId") applicationId: number,
  ): Promise<ActiveApplicationDataAPIOutDTO> {
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
    return transformToActiveApplicationDataAPIOutDTO(application, offering);
  }

  /**
   * Get locations details of logged in user.
   * @returns location details.
   */
  @Get()
  async getMyInstitutionLocationsDetails(
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<InstitutionLocationsAPIOutDTO[]> {
    // Get all institution locations that user has access too.
    const InstitutionLocationData =
      await this.locationService.getMyInstitutionLocations(
        userToken.authorizations.getLocationsIds(),
      );
    return InstitutionLocationData.map((location) => {
      return {
        id: location.id,
        name: location.name,
      };
    });
  }
}
