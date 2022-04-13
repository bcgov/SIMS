import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiTags,
} from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  HasLocationAccess,
  IsInstitutionAdmin,
  UserToken,
} from "../../auth/decorators";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import {
  ApplicationService,
  FormService,
  InstitutionLocationService,
} from "../../services";
import { ClientTypeBaseRoute } from "../../types";
import {
  dateString,
  getISODateOnlyString,
  deliveryMethod,
  credentialTypeToDisplay,
  getUserFullName,
} from "../../utilities";
import {
  ActiveApplicationDataAPIOutDTO,
  ActiveApplicationSummaryAPIOutDTO,
} from "./models/application.dto";
import BaseController from "../BaseController";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { InstitutionLocationControllerService } from "./institution-location.controller.service";
import {
  InstitutionLocationAPIOutDTO,
  InstitutionLocationFormAPIInDTO,
  InstitutionLocationFormAPIOutDTO,
} from "./models/institution-location.dto";

/**
 * Institution location controller for institutions Client.
 */
@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("institution/location")
@ApiTags(`${ClientTypeBaseRoute.Institution}-institution/location`)
export class InstitutionLocationInstitutionsController extends BaseController {
  constructor(
    private readonly locationControllerService: InstitutionLocationControllerService,
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
      "institutionlocation",
      payload,
    );

    if (!dryRunSubmissionResult.valid) {
      throw new BadRequestException(
        "Not able to create the institution location due to an invalid request.",
      );
    }

    // If the data is valid the location is saved to SIMS DB.
    const createdInstitutionLocation =
      await this.locationService.createLocation(
        userToken.authorizations.institutionId,
        dryRunSubmissionResult.data,
      );

    return { id: createdInstitutionLocation.id };
  }

  /**
   * Update an institution location.
   * @param locationId
   * @param payload
   * @returns number of updated rows.
   */
  @ApiBadRequestResponse({
    description: "Invalid request to update the institution location.",
  })
  @HasLocationAccess("locationId")
  @IsInstitutionAdmin()
  @Patch(":locationId")
  async update(
    @Param("locationId") locationId: number,
    @Body() payload: InstitutionLocationFormAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<void> {
    // Validate the location data that will be saved to SIMS DB.
    const dryRunSubmissionResult = await this.formService.dryRunSubmission(
      "institutionlocation",
      payload,
    );

    if (!dryRunSubmissionResult.valid) {
      throw new BadRequestException(
        "Not able to create the institution location due to an invalid request.",
      );
    }

    // If the data is valid the location is updated to SIMS DB.
    await this.locationService.updateLocation(
      locationId,
      userToken.authorizations.institutionId,
      dryRunSubmissionResult.data.data,
    );
  }

  /**
   * Controller method to get institution locations with designation status for the given institution.
   * @param userToken
   * @returns Details of all locations of an institution.
   */
  @IsInstitutionAdmin()
  @Get()
  async getAllInstitutionLocations(
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<InstitutionLocationAPIOutDTO[]> {
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
  ): Promise<ActiveApplicationSummaryAPIOutDTO[]> {
    const applications = await this.applicationService.getActiveApplications(
      locationId,
    );
    return applications.map((eachApplication) => {
      const offering = eachApplication.currentAssessment?.offering;
      return {
        applicationNumber: eachApplication.applicationNumber,
        applicationId: eachApplication.id,
        studyStartPeriod: getISODateOnlyString(offering?.studyStartDate),
        studyEndPeriod: getISODateOnlyString(offering?.studyEndDate),
        applicationStatus: eachApplication.applicationStatus,
        fullName: getUserFullName(eachApplication.student.user),
      };
    });
  }

  /**
   * Controller method to retrieve institution location by id.
   * @param locationId
   * @param userToken
   * @returns institution location.
   */
  @HasLocationAccess("locationId")
  @Get(":locationId")
  async getInstitutionLocation(
    @Param("locationId") locationId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<InstitutionLocationFormAPIOutDTO> {
    // get all institution locations.
    const institutionLocation =
      await this.locationService.getInstitutionLocation(
        userToken.authorizations.institutionId,
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
    };
  }

  /**
   * Get active application details.
   * @param applicationId active application of the location.
   * @param locationId
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
