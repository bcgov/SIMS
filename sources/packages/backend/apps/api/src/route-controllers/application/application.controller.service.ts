import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  EducationProgramOfferingService,
  InstitutionLocationService,
  EducationProgramService,
  StudentRestrictionService,
  ApplicationService,
  StudentAppealService,
  ApplicationOfferingChangeRequestService,
  CRAIncomeVerificationService,
  SupportingUserService,
} from "../../services";
import {
  ApplicationFormData,
  ApplicationDataAPIOutDTO,
  SuccessWaitingStatus,
  ApplicationIncomeVerification,
  ApplicationSupportingUserDetails,
  EnrolmentApplicationDetailsAPIOutDTO,
  ApplicationSupplementalDataAPIOutDTO,
  ApplicationProgressDetailsAPIOutDTO,
  CompletedApplicationDetailsAPIOutDTO,
  InProgressApplicationDetailsAPIOutDTO,
} from "./models/application.dto";
import {
  credentialTypeToDisplay,
  deliveryMethod,
  getCOEDeniedReason,
  getOfferingNameAndPeriod,
  getPIRDeniedReason,
  getUserFullName,
} from "../../utilities";
import { getDateOnlyFormat } from "@sims/utilities";
import {
  Application,
  ApplicationData,
  CRAIncomeVerification,
  DisbursementSchedule,
  OfferingIntensity,
  ProgramStatus,
  SupportingUser,
  SupportingUserType,
  RestrictionActionType,
  ApplicationOfferingChangeRequestStatus,
  ApplicationStatus,
  StudentAppealStatus,
} from "@sims/sims-db";
import { ApiProcessError } from "../../types";
import { ACTIVE_STUDENT_RESTRICTION } from "../../constants";
import { ECertPreValidationService } from "@sims/integrations/services/disbursement-schedule/e-cert-calculation";
import { AssessmentSequentialProcessingService } from "@sims/services";

/**
 * This service controller is a provider which is created to extract the implementation of
 * controller in one place as their business logic is shared between different client types.
 * (e.g. AEST and Student).
 */
@Injectable()
export class ApplicationControllerService {
  constructor(
    private readonly offeringService: EducationProgramOfferingService,
    private readonly locationService: InstitutionLocationService,
    private readonly programService: EducationProgramService,
    private readonly studentRestrictionService: StudentRestrictionService,
    private readonly applicationService: ApplicationService,
    private readonly studentAppealService: StudentAppealService,
    private readonly applicationOfferingChangeRequestService: ApplicationOfferingChangeRequestService,
    private readonly eCertPreValidationService: ECertPreValidationService,
    private readonly craIncomeVerificationService: CRAIncomeVerificationService,
    private readonly supportingUserService: SupportingUserService,
    private readonly assessmentSequentialProcessingService: AssessmentSequentialProcessingService,
  ) {}

  /**
   * Add location, program and offering labels
   * and reset the dropdown value for non
   * designated location and not approved
   * programs.
   * @param data application data
   * @returns ApplicationFormData
   */
  async generateApplicationFormData(
    data: ApplicationData,
  ): Promise<ApplicationFormData> {
    const additionalFormData = {} as ApplicationFormData;
    await this.processSelectedLocation(data, additionalFormData);
    await this.processSelectedProgram(data, additionalFormData);
    await this.processSelectedOffering(data, additionalFormData);
    return { ...data, ...additionalFormData };
  }
  /**
   * Get status of all requests and confirmations in student application (Exception, PIR and COE).
   * @param applicationId application id.
   * @param options options.
   * - `studentId` student id.
   * @returns application progress details.
   */
  async getApplicationProgressDetails(
    applicationId: number,
    options?: { studentId?: number },
  ): Promise<ApplicationProgressDetailsAPIOutDTO> {
    const application = await this.applicationService.getApplicationDetails(
      applicationId,
      { studentId: options?.studentId },
    );
    if (!application) {
      throw new NotFoundException(
        `Application id ${applicationId} was not found.`,
      );
    }

    let appealStatus: StudentAppealStatus;
    let applicationOfferingChangeRequestStatus: ApplicationOfferingChangeRequestStatus;
    let hasBlockFundingFeedbackError = false;
    let hasECertFailedValidations = false;
    if (application.applicationStatus === ApplicationStatus.Completed) {
      const appealPromise = this.studentAppealService.getAppealsForApplication(
        applicationId,
        { studentId: options?.studentId, limit: 1 },
      );
      const applicationOfferingChangeRequestPromise =
        this.applicationOfferingChangeRequestService.getApplicationOfferingChangeRequest(
          applicationId,
          { studentId: options.studentId },
        );
      const feedbackErrorPromise =
        this.applicationService.hasFeedbackErrorBlockingFunds(applicationId);
      const eCertValidationResultPromise =
        this.eCertPreValidationService.executePreValidations(applicationId);
      const [
        [appeal],
        applicationOfferingChangeRequest,
        feedbackError,
        eCertValidationResult,
      ] = await Promise.all([
        appealPromise,
        applicationOfferingChangeRequestPromise,
        feedbackErrorPromise,
        eCertValidationResultPromise,
      ]);
      appealStatus = appeal?.status;
      applicationOfferingChangeRequestStatus =
        applicationOfferingChangeRequest?.applicationOfferingChangeRequestStatus;
      hasBlockFundingFeedbackError = feedbackError;
      hasECertFailedValidations = !eCertValidationResult.canGenerateECert;
    }

    const assessmentTriggerType = application.currentAssessment?.triggerType;

    const disbursements =
      application.currentAssessment?.disbursementSchedules ?? [];

    disbursements.sort((a, b) =>
      a.disbursementDate < b.disbursementDate ? -1 : 1,
    );
    const [firstDisbursement, secondDisbursement] = disbursements;
    const [scholasticStandingChange] = application.studentScholasticStandings;

    return {
      applicationStatus: application.applicationStatus,
      applicationStatusUpdatedOn: application.applicationStatusUpdatedOn,
      pirStatus: application.pirStatus,
      firstCOEStatus: firstDisbursement?.coeStatus,
      secondCOEStatus: secondDisbursement?.coeStatus,
      exceptionStatus: application.applicationException?.exceptionStatus,
      appealStatus,
      scholasticStandingChangeType: scholasticStandingChange?.changeType,
      applicationOfferingChangeRequestStatus,
      assessmentTriggerType,
      hasBlockFundingFeedbackError,
      hasECertFailedValidations,
    };
  }

  /**
   * Get details for the application in enrolment status.
   * @param applicationId student application id.
   * @param options options.
   *  - `studentId` student id.
   * @returns details for the application enrolment status.
   */
  async getEnrolmentApplicationDetails(
    applicationId: number,
    options?: { studentId?: number },
  ): Promise<EnrolmentApplicationDetailsAPIOutDTO> {
    const application =
      await this.applicationService.getApplicationAssessmentDetails(
        applicationId,
        {
          studentId: options?.studentId,
          applicationStatus: [ApplicationStatus.Enrolment],
        },
      );
    if (!application) {
      throw new NotFoundException(
        `Application id ${applicationId} not found or not in relevant status to get enrolment details.`,
      );
    }

    return {
      ...this.transformToEnrolmentApplicationDetailsAPIOutDTO(
        application.currentAssessment.disbursementSchedules,
      ),
      assessmentTriggerType: application.currentAssessment.triggerType,
    };
  }

  /**
   * Get details for an application at completed status.
   * @param applicationId application id.
   * @param options options.
   * - `studentId` student id.
   * @returns details for an application on at completed status.
   */
  async getCompletedApplicationDetails(
    applicationId: number,
    options?: { studentId?: number },
  ): Promise<CompletedApplicationDetailsAPIOutDTO> {
    const getApplicationPromise =
      this.applicationService.getApplicationAssessmentDetails(applicationId, {
        studentId: options?.studentId,
        applicationStatus: [ApplicationStatus.Completed],
      });
    const appealPromise = this.studentAppealService.getAppealsForApplication(
      applicationId,
      { studentId: options?.studentId, limit: 1 },
    );
    const applicationOfferingChangeRequestPromise =
      this.applicationOfferingChangeRequestService.getApplicationOfferingChangeRequest(
        applicationId,
        { studentId: options?.studentId },
      );
    const hasBlockFundingFeedbackErrorPromise =
      this.applicationService.hasFeedbackErrorBlockingFunds(applicationId);
    const eCertValidationResultPromise =
      this.eCertPreValidationService.executePreValidations(applicationId);
    const [
      application,
      [appeal],
      applicationOfferingChangeRequest,
      hasBlockFundingFeedbackError,
      eCertValidationResult,
    ] = await Promise.all([
      getApplicationPromise,
      appealPromise,
      applicationOfferingChangeRequestPromise,
      hasBlockFundingFeedbackErrorPromise,
      eCertValidationResultPromise,
    ]);
    if (!application) {
      throw new NotFoundException(
        `Application not found or not on ${ApplicationStatus.Completed} status.`,
      );
    }
    const enrolmentDetails =
      this.transformToEnrolmentApplicationDetailsAPIOutDTO(
        application.currentAssessment.disbursementSchedules,
      );
    const [scholasticStandingChange] = application.studentScholasticStandings;

    return {
      firstDisbursement: enrolmentDetails.firstDisbursement,
      secondDisbursement: enrolmentDetails.secondDisbursement,
      assessmentTriggerType: application.currentAssessment.triggerType,
      appealStatus: appeal?.status,
      scholasticStandingChangeType: scholasticStandingChange?.changeType,
      applicationOfferingChangeRequestId: applicationOfferingChangeRequest?.id,
      applicationOfferingChangeRequestStatus:
        applicationOfferingChangeRequest?.applicationOfferingChangeRequestStatus,
      hasBlockFundingFeedbackError,
      eCertFailedValidations: [...eCertValidationResult.failedValidations],
    };
  }

  /**
   * Get in progress details of an application by application id.
   * @param applicationId application id.
   * @param options options.
   * - `studentId` student id.
   * @returns application details.
   */
  async getInProgressApplicationDetails(
    applicationId: number,
    options?: { studentId?: number },
  ): Promise<InProgressApplicationDetailsAPIOutDTO> {
    const application = await this.applicationService.getApplicationDetails(
      applicationId,
      { studentId: options?.studentId },
    );
    if (!application) {
      throw new NotFoundException(
        `Application id ${applicationId} was not found.`,
      );
    }
    const incomeVerificationDetails =
      await this.craIncomeVerificationService.getAllIncomeVerificationsForAnApplication(
        applicationId,
      );
    const incomeVerification = this.processApplicationIncomeVerificationDetails(
      incomeVerificationDetails,
    );

    const supportingUserDetails =
      await this.supportingUserService.getSupportingUsersByApplicationId(
        applicationId,
      );

    const supportingUser = this.processApplicationSupportingUserDetails(
      supportingUserDetails,
    );

    // Get the first outstanding assessment waiting for calculation as per the sequence.
    const firstOutstandingStudentAssessment =
      await this.assessmentSequentialProcessingService.getOutstandingAssessmentsForStudentInSequence(
        application.student.id,
        application.programYear.id,
      );

    // If first outstanding assessment returns a value and its Id is different
    // from the current assessment Id, then assessmentInCalculationStep is Waiting.
    const outstandingAssessmentStatus =
      firstOutstandingStudentAssessment &&
      firstOutstandingStudentAssessment.id !== application.currentAssessment.id
        ? SuccessWaitingStatus.Waiting
        : SuccessWaitingStatus.Success;

    return {
      id: application.id,
      applicationStatus: application.applicationStatus,
      pirStatus: application.pirStatus,
      pirDeniedReason: getPIRDeniedReason(application),
      exceptionStatus: application.applicationException?.exceptionStatus,
      outstandingAssessmentStatus: outstandingAssessmentStatus,
      ...incomeVerification,
      ...supportingUser,
    };
  }
  /**
   * Check whether the selected location is designated or not.
   * If selected location is not designated, then make the
   * selectedLocation null.
   * @param data application data.
   * @param additionalFormData form data for readonly form.
   */
  private async processSelectedLocation(
    data: ApplicationData,
    additionalFormData: ApplicationFormData,
  ) {
    if (data.selectedLocation) {
      const designatedLocation = await this.locationService.getLocation(
        data.selectedLocation,
      );
      if (!designatedLocation.isDesignated) {
        data.selectedLocation = null;
      }
      // Assign location name for readonly form.
      additionalFormData.selectedLocationName = designatedLocation.locationName;
    }
  }

  /**
   * Check wether the program is approved or not.
   * If selected program is not approved, then make the
   * selectedProgram null.
   * @param data application data.
   * @param additionalFormData form data for readonly form.
   */
  private async processSelectedProgram(
    data: ApplicationData,
    additionalFormData: ApplicationFormData,
  ) {
    if (data.selectedProgram) {
      const selectedProgram = await this.programService.getProgramById(
        data.selectedProgram,
      );
      if (selectedProgram) {
        // Assign selected program && selected offering for application as null when the program is not approved, inactive or expired.
        if (
          !selectedProgram.isActive ||
          selectedProgram.isExpired ||
          selectedProgram.programStatus !== ProgramStatus.Approved
        ) {
          data.selectedProgram = null;
        }
        // Assign program name for readonly form.
        additionalFormData.selectedProgramName = selectedProgram.name;
        // Program details.
        additionalFormData.selectedProgramDesc = {
          credentialType: selectedProgram.credentialType,
          credentialTypeToDisplay: credentialTypeToDisplay(
            selectedProgram.credentialType,
          ),
          deliveryMethod: deliveryMethod(
            selectedProgram.deliveredOnline,
            selectedProgram.deliveredOnSite,
          ),
          description: selectedProgram.description,
          id: selectedProgram.id,
          name: selectedProgram.name,
        };
      } else {
        data.selectedProgram = null;
      }
    }
  }

  /**
   * Get selected offering details.
   * If selected offering is not found, then make the
   * selectedOffering null.
   * @param data application data.
   * @param additionalFormData form data for readonly form.
   */
  private async processSelectedOffering(
    data: ApplicationData,
    additionalFormData: ApplicationFormData,
  ) {
    if (data.selectedOffering) {
      const selectedOffering = await this.offeringService.getOfferingById(
        data.selectedOffering,
      );
      if (selectedOffering) {
        additionalFormData.selectedOfferingName =
          getOfferingNameAndPeriod(selectedOffering);
      } else {
        data.selectedOffering = null;
      }
    }
  }

  /**
   * Transformation util for Application.
   * @param application
   * @returns Application DTO
   */
  async transformToApplicationDTO(
    application: Application,
  ): Promise<ApplicationSupplementalDataAPIOutDTO> {
    return {
      data: application.data,
      id: application.id,
      applicationStatus: application.applicationStatus,
      applicationNumber: application.applicationNumber,
      applicationFormName: application.programYear.formName,
      applicationProgramYearID: application.programYear.id,
      studentFullName: getUserFullName(application.student.user),
      applicationOfferingIntensity:
        application.currentAssessment?.offering?.offeringIntensity,
      applicationStartDate:
        application.currentAssessment?.offering?.studyStartDate,
      applicationEndDate: application.currentAssessment?.offering?.studyEndDate,
      applicationInstitutionName:
        application.location?.institution.legalOperatingName,
    };
  }

  /**
   * Convert disbursements into the enrolment DTO with information
   * about first and second disbursements.
   * @param disbursementSchedules disbursements to be converted to the DTO.
   * @returns enrolment DTO.
   */
  transformToEnrolmentApplicationDetailsAPIOutDTO(
    disbursementSchedules: DisbursementSchedule[],
  ): EnrolmentApplicationDetailsAPIOutDTO {
    const [firstDisbursement, secondDisbursement] = disbursementSchedules;
    const details = {} as EnrolmentApplicationDetailsAPIOutDTO;
    if (firstDisbursement) {
      details.firstDisbursement = {
        coeStatus: firstDisbursement.coeStatus,
        disbursementScheduleStatus:
          firstDisbursement.disbursementScheduleStatus,
        coeDenialReason: getCOEDeniedReason(firstDisbursement),
      };
      if (secondDisbursement) {
        details.secondDisbursement = {
          coeStatus: secondDisbursement.coeStatus,
          disbursementScheduleStatus:
            secondDisbursement.disbursementScheduleStatus,
          coeDenialReason: getCOEDeniedReason(secondDisbursement),
        };
      }
    }
    return details;
  }

  /**
   * Transformation util for Application.
   * @param applicationDetail
   * @param disbursement
   * @returns Application DTO
   */
  async transformToApplicationDetailForStudentDTO(
    applicationDetail: Application,
    disbursement: DisbursementSchedule,
  ): Promise<ApplicationDataAPIOutDTO> {
    const offering = applicationDetail.currentAssessment?.offering;
    return {
      id: applicationDetail.id,
      assessmentId: applicationDetail.currentAssessment?.id,
      data: applicationDetail.data,
      applicationStatus: applicationDetail.applicationStatus,
      applicationStatusUpdatedOn: applicationDetail.applicationStatusUpdatedOn,
      applicationNumber: applicationDetail.applicationNumber,
      applicationOfferingIntensity: offering?.offeringIntensity,
      applicationStartDate: getDateOnlyFormat(offering?.studyStartDate),
      applicationEndDate: getDateOnlyFormat(offering?.studyEndDate),
      applicationInstitutionName: applicationDetail?.location?.name,
      applicationPIRStatus: applicationDetail.pirStatus,
      applicationAssessmentStatus:
        applicationDetail.currentAssessment?.noaApprovalStatus,
      applicationFormName: applicationDetail.programYear.formName,
      applicationProgramYearID: applicationDetail.programYear.id,
      applicationPIRDeniedReason: getPIRDeniedReason(applicationDetail),
      programYearStartDate: applicationDetail.programYear.startDate,
      programYearEndDate: applicationDetail.programYear.endDate,
      applicationCOEStatus: disbursement?.coeStatus,
      applicationCOEDeniedReason: disbursement
        ? getCOEDeniedReason(disbursement)
        : undefined,
      submittedDate: applicationDetail.submittedDate,
    };
  }

  /**
   * This method checks if the student has any apply (i.e Stop full time or
   * Stop part time) restriction on the offering intensity they selected
   * in there application.
   * @param studentId student id.
   * @param offeringIntensity offering intensity selected by the student.
   */
  async offeringIntensityRestrictionCheck(
    studentId: number,
    offeringIntensity: OfferingIntensity,
  ): Promise<void> {
    let hasRestrictionAction = false;

    if (offeringIntensity === OfferingIntensity.fullTime) {
      hasRestrictionAction =
        await this.studentRestrictionService.hasRestrictionAction(studentId, [
          RestrictionActionType.StopFullTimeApply,
        ]);
    } else if (offeringIntensity === OfferingIntensity.partTime) {
      hasRestrictionAction =
        await this.studentRestrictionService.hasRestrictionAction(studentId, [
          RestrictionActionType.StopPartTimeApply,
        ]);
    }
    if (hasRestrictionAction) {
      throw new ForbiddenException(
        new ApiProcessError(
          "You have a restriction on your account.",
          ACTIVE_STUDENT_RESTRICTION,
        ),
      );
    }
  }

  /**
   * Process application income verification details.
   * @param craIncomeVerification CRA income verification data.
   * @return processed object.
   */
  processApplicationIncomeVerificationDetails(
    craIncomeVerification: CRAIncomeVerification[],
  ): ApplicationIncomeVerification {
    const incomeVerificationDetails = {} as ApplicationIncomeVerification;
    // Student.
    const [student] = craIncomeVerification.filter(
      (incomeVerification) => !incomeVerification.supportingUser,
    );
    if (student) {
      // Student income verification details.
      incomeVerificationDetails.studentIncomeVerificationStatus =
        !student.dateReceived
          ? SuccessWaitingStatus.Waiting
          : SuccessWaitingStatus.Success;
    }
    // Parent.
    const [parent1, parent2] = craIncomeVerification.filter(
      (incomeVerification) =>
        incomeVerification.supportingUser?.supportingUserType ===
        SupportingUserType.Parent,
    );
    if (parent1) {
      incomeVerificationDetails.parent1IncomeVerificationStatus =
        !parent1.dateReceived
          ? SuccessWaitingStatus.Waiting
          : SuccessWaitingStatus.Success;
    }
    if (parent2) {
      incomeVerificationDetails.parent2IncomeVerificationStatus =
        !parent2.dateReceived
          ? SuccessWaitingStatus.Waiting
          : SuccessWaitingStatus.Success;
    }

    // Partner.
    const [partner] = craIncomeVerification.filter(
      (incomeVerification) =>
        incomeVerification.supportingUser?.supportingUserType ===
        SupportingUserType.Partner,
    );
    // partner income verification details.
    if (partner) {
      incomeVerificationDetails.partnerIncomeVerificationStatus =
        !partner.dateReceived
          ? SuccessWaitingStatus.Waiting
          : SuccessWaitingStatus.Success;
    }
    return incomeVerificationDetails;
  }

  /**
   * Process application supporting user details.
   * @param supportingUser supporting users data.
   * @return processed object.
   */
  processApplicationSupportingUserDetails(
    supportingUser: SupportingUser[],
  ): ApplicationSupportingUserDetails {
    const supportingUserDetails = {} as ApplicationSupportingUserDetails;
    // Parent.
    const [parent1, parent2] = supportingUser.filter(
      (incomeVerification) =>
        incomeVerification.supportingUserType === SupportingUserType.Parent,
    );
    if (parent1) {
      supportingUserDetails.parent1Info = !parent1.supportingData
        ? SuccessWaitingStatus.Waiting
        : SuccessWaitingStatus.Success;
    }
    if (parent2) {
      supportingUserDetails.parent2Info = !parent2.supportingData
        ? SuccessWaitingStatus.Waiting
        : SuccessWaitingStatus.Success;
    }

    // Partner.
    const [partner] = supportingUser.filter(
      (incomeVerification) =>
        incomeVerification.supportingUserType === SupportingUserType.Partner,
    );
    if (partner) {
      supportingUserDetails.partnerInfo = !partner.supportingData
        ? SuccessWaitingStatus.Waiting
        : SuccessWaitingStatus.Success;
    }

    return supportingUserDetails;
  }
}
