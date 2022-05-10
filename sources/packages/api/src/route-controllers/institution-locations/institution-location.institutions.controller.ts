import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
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
  APPLICATION_NOT_FOUND,
  ASSESSMENT_ALREADY_IN_PROGRESS,
  FormService,
  InstitutionLocationService,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
  StudentAssessmentService,
  StudentScholasticStandingsService,
} from "../../services";
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";
import {
  dateString,
  getISODateOnlyString,
  deliveryMethod,
  credentialTypeToDisplay,
  getUserFullName,
  CustomNamedError,
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
  ScholasticStandingAPIInDTO,
} from "./models/institution-location.dto";
import { FormNames } from "../../services/form/constants";
import { transformAddressDetailsForAddressBlockForm } from "../utils/address-utils";

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
    private readonly studentScholasticStandingsService: StudentScholasticStandingsService,
    private readonly studentAssessmentService: StudentAssessmentService,
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
  ): Promise<void> {
    return this.locationControllerService.update(locationId, payload);
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
      applicationOfferingStudyBreak: offering.studyBreaks?.map(
        (studyBreak) => ({
          breakStartDate: dateString(studyBreak.breakStartDate),
          breakEndDate: dateString(studyBreak.breakEndDate),
        }),
      ),
      applicationOfferingTuition: offering.actualTuitionCosts,
      applicationOfferingProgramRelatedCosts: offering.programRelatedCosts,
      applicationOfferingMandatoryFess: offering.mandatoryFees,
      applicationOfferingExceptionalExpenses: offering.exceptionalExpenses,
    };
  }

  /**
   * Save scholastic standing and create new assessment.
   * @param locationId location id to check whether the requested user and the requested application has the permission to this location.
   * @param applicationId application id.
   * @UserToken institution user token
   * @param payload Scholastic Standing payload.
   */
  @ApiBadRequestResponse({ description: "Invalid form data." })
  @ApiUnprocessableEntityResponse({
    description:
      "Application not found or invalid application or invalid" +
      " application status or another assessment already in progress.",
  })
  @HasLocationAccess("locationId")
  @Post(":locationId/application/:applicationId/scholastic-standing")
  async saveScholasticStanding(
    @Param("locationId") locationId: number,
    @Param("applicationId") applicationId: number,
    @Body() payload: ScholasticStandingAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<void> {
    try {
      const submissionResult = await this.formService.dryRunSubmission(
        FormNames.ReportScholasticStandingChange,
        payload.data,
      );

      if (!submissionResult.valid) {
        throw new BadRequestException("Invalid submission.");
      }
      const scholasticStanding =
        await this.studentScholasticStandingsService.saveScholasticStandingCreateReassessment(
          locationId,
          applicationId,
          userToken.userId,
          submissionResult.data.data,
        );

      // Start assessment.
      if (scholasticStanding.studentAssessment) {
        await this.studentAssessmentService.startAssessment(
          scholasticStanding.studentAssessment.id,
        );
      }
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case APPLICATION_NOT_FOUND:
          case INVALID_OPERATION_IN_THE_CURRENT_STATUS:
          case ASSESSMENT_ALREADY_IN_PROGRESS:
            throw new UnprocessableEntityException(
              new ApiProcessError(error.message, error.name),
            );
          default:
            throw error;
        }
      }
      throw error;
    }
  }
}
