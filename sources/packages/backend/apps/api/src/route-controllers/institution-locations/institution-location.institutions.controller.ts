import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
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
import { ClientTypeBaseRoute, ApiProcessError } from "../../types";
import { getUserFullName } from "../../utilities";
import { getISODateOnlyString, CustomNamedError } from "@sims/utilities";
import {
  ActiveApplicationDataAPIOutDTO,
  ActiveApplicationSummaryAPIOutDTO,
  ActiveApplicationSummaryQueryStringAPIInDTO,
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
import { PaginatedResultsAPIOutDTO } from "../models/pagination.dto";
import { DUPLICATE_INSTITUTION_LOCATION_CODE } from "../../constants";
import { InstitutionLocationModel } from "../../services/institution-location/institution-location.models";

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
   * @param payload details of the institution location to be created.
   * @returns Primary identifier of created location.
   */
  @ApiBadRequestResponse({
    description: "Invalid request to create an institution location.",
  })
  @ApiUnprocessableEntityResponse({
    description: "Duplicate institution location code.",
  })
  @IsInstitutionAdmin()
  @Post()
  async create(
    @Body() payload: InstitutionLocationFormAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    // Validate the location data that will be saved to SIMS DB.
    const dryRunSubmissionResult =
      await this.formService.dryRunSubmission<InstitutionLocationModel>(
        FormNames.InstitutionLocation,
        payload,
      );

    if (!dryRunSubmissionResult.valid) {
      throw new BadRequestException(
        "Not able to create the institution location due to an invalid request.",
      );
    }

    try {
      // If the data is valid the location is saved to SIMS DB.
      const createdInstitutionLocation =
        await this.locationService.createLocation(
          userToken.authorizations.institutionId,
          dryRunSubmissionResult.data.data,
          userToken.userId,
        );
      return { id: createdInstitutionLocation.id };
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

  /**
   * Update an institution location.
   * @param locationId id of the institution location to be updated.
   * @param payload details of the institution location to be updated.
   */
  @HasLocationAccess("locationId")
  @IsInstitutionAdmin()
  @Patch(":locationId")
  async update(
    @Param("locationId", ParseIntPipe) locationId: number,
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
   * @param queryStringDTO represents all query strings expected to be received by
   * this endpoint (pagination options and archive filter).
   * @param archived archive value of applications requested by user.
   * @returns Student active application list of an institution location.
   */
  @HasLocationAccess("locationId")
  @Get(":locationId/active-applications")
  async getActiveApplications(
    @Param("locationId", ParseIntPipe) locationId: number,
    @Query() queryStringDTO: ActiveApplicationSummaryQueryStringAPIInDTO,
  ): Promise<PaginatedResultsAPIOutDTO<ActiveApplicationSummaryAPIOutDTO>> {
    const applications = await this.applicationService.getActiveApplications(
      locationId,
      queryStringDTO,
      queryStringDTO.archived,
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
   * @param locationId id of the location to be retrieved.
   * @returns institution location.
   */
  @HasLocationAccess("locationId")
  @Get(":locationId")
  @ApiNotFoundResponse({ description: "Institution Location not found." })
  async getInstitutionLocation(
    @Param("locationId", ParseIntPipe) locationId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<InstitutionLocationDetailsAPIOutDTO> {
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
    @Param("locationId", ParseIntPipe) locationId: number,
    @Param("applicationId", ParseIntPipe) applicationId: number,
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
