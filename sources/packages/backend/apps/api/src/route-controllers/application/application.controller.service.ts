import { ForbiddenException, Injectable } from "@nestjs/common";
import {
  EducationProgramOfferingService,
  InstitutionLocationService,
  EducationProgramService,
  StudentRestrictionService,
} from "../../services";
import {
  ApplicationFormData,
  GetApplicationBaseDTO,
  GetApplicationDataDto,
  SuccessWaitingStatus,
} from "./models/application.model";
import {
  credentialTypeToDisplay,
  getDateOnlyFormat,
  deliveryMethod,
  getCOEDeniedReason,
  getOfferingNameAndPeriod,
  getPIRDeniedReason,
} from "../../utilities";
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
} from "@sims/sims-db";
import { ApiProcessError } from "../../types";
import { ACTIVE_STUDENT_RESTRICTION } from "../../constants";
import {
  ApplicationIncomeVerification,
  ApplicationSupportingUserDetails,
} from "./models/application.system.dto";

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
    // Check wether the selected location is designated or not.
    // If selected location is not designated, then make the
    // selectedLocation null
    if (data.selectedLocation) {
      const designatedLocation = await this.locationService.getLocation(
        data.selectedLocation,
      );
      if (!designatedLocation.isDesignated) {
        data.selectedLocation = null;
      }
      // Assign location name for readonly form
      additionalFormData.selectedLocationName = designatedLocation.locationName;
    }
    // Check wether the program is approved or not.
    // If selected program is not approved, then make the
    // selectedLocation null
    if (data.selectedProgram) {
      const selectedProgram = await this.programService.getProgramById(
        data.selectedProgram,
      );

      if (selectedProgram) {
        // Assign program name for readonly form
        additionalFormData.selectedProgramName = selectedProgram.name;
        // Program details
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
        if (selectedProgram.programStatus !== ProgramStatus.Approved) {
          data.selectedProgram = null;
        }
      } else {
        data.selectedProgram = null;
      }
    }
    // Get selected offering details.
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
    return { ...data, ...additionalFormData };
  }

  /**
   * Transformation util for Application.
   * @param application
   * @returns Application DTO
   */
  async transformToApplicationForAESTDTO(
    application: Application,
  ): Promise<GetApplicationBaseDTO> {
    return {
      data: application.data,
      id: application.id,
      applicationStatus: application.applicationStatus,
      applicationNumber: application.applicationNumber,
      applicationFormName: application.programYear.formName,
      applicationProgramYearID: application.programYear.id,
    } as GetApplicationBaseDTO;
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
  ): Promise<GetApplicationDataDto> {
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
