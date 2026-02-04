import {
  DisbursementSchedule,
  AssessmentTriggerType,
  ApplicationExceptionStatus,
  StudentAssessmentStatus,
  ApplicationOfferingChangeRequestStatus,
  DisbursementValueType,
  DisbursementScheduleStatus,
} from "@sims/sims-db";
import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  StudentAssessmentService,
  StudentAppealService,
  StudentScholasticStandingsService,
  EducationProgramOfferingService,
  ApplicationExceptionService,
  MASKED_MSFAA_NUMBER,
  ApplicationOfferingChangeRequestService,
  MASKED_MONEY_AMOUNT,
} from "../../services";
import {
  AssessmentNOAAPIOutDTO,
  RequestAssessmentSummaryAPIOutDTO,
  RequestAssessmentTypeAPIOutDTO,
  AssessmentHistorySummaryAPIOutDTO,
  DynamicAwardValue,
  AssessmentAPIOutDTO,
  AwardDisbursementScheduleAPIOutDTO,
  AwardDisbursementValueAPIOutDTO,
  AwardDetailsAPIOutDTO,
} from "./models/assessment.dto";
import { getUserFullName } from "../../utilities";
import {
  getDateOnlyFormat,
  getDateOnlyFullMonthFormat,
  getTotalDisbursementAmountFromSchedules,
} from "@sims/utilities";
import {
  AwardOverawardBalance,
  DisbursementOverawardService,
} from "@sims/services";
import {
  ActiveRestriction,
  ECertGenerationService,
  EligibleECertDisbursement,
} from "@sims/integrations/services";
import { getStopFundingTypesAndRestrictionsMap } from "@sims/integrations/services/disbursement-schedule/e-cert-processing-steps/e-cert-steps-utils";

@Injectable()
export class AssessmentControllerService {
  constructor(
    private readonly assessmentService: StudentAssessmentService,
    private readonly studentAppealService: StudentAppealService,
    private readonly studentScholasticStandingsService: StudentScholasticStandingsService,
    private readonly educationProgramOfferingService: EducationProgramOfferingService,
    private readonly applicationExceptionService: ApplicationExceptionService,
    private readonly applicationOfferingChangeRequestService: ApplicationOfferingChangeRequestService,
    private readonly disbursementOverawardService: DisbursementOverawardService,
    private readonly eCertGenerationService: ECertGenerationService,
  ) {}

  /**
   * Get the notice of assessment data from the assessment.
   * @param assessmentId assessment id to be retrieved.
   * @param options for NOA.
   * - `studentId` optional student for authorization when needed.
   * - `applicationId` application id,
   * - `maskMSFAA` mask MSFAA or not.
   * - `maskTotalFamilyIncome` mask total family income resulted
   * from the assessment calculations. Defaults to true if not provided.
   * @returns notice of assessment data.
   */
  async getAssessmentNOA(
    assessmentId: number,
    options?: {
      studentId?: number;
      applicationId?: number;
      maskMSFAA?: boolean;
      maskTotalFamilyIncome?: boolean;
    },
  ): Promise<AssessmentNOAAPIOutDTO> {
    const maskTotalFamilyIncome = options?.maskTotalFamilyIncome ?? true;
    const assessment = await this.assessmentService.getAssessmentForNOA(
      assessmentId,
      { studentId: options?.studentId, applicationId: options?.applicationId },
    );

    if (!assessment) {
      throw new NotFoundException("Assessment was not found.");
    }

    if (!assessment.assessmentData) {
      throw new UnprocessableEntityException(
        "Notice of assessment data is not present.",
      );
    }

    const assessmentDTO: AssessmentAPIOutDTO = assessment.assessmentData;
    if (maskTotalFamilyIncome) {
      assessmentDTO.totalFamilyIncome = MASKED_MONEY_AMOUNT;
    }

    // Set the values from the workflow data to the assessment.
    assessmentDTO.totalAdditionalTransportationAllowance =
      assessment.workflowData.calculatedData.totalAdditionalTransportationAllowance;
    assessmentDTO.returnTransportationCost =
      assessment.workflowData.calculatedData.returnTransportationCost;

    // Set the additional calculated data fields for NOA funding tab.
    assessmentDTO.studentDataDependantstatus =
      assessment.workflowData.studentData.dependantStatus;
    assessmentDTO.calculatedDataFamilySize =
      assessment.workflowData.calculatedData.familySize;
    assessmentDTO.calculatedDataTotalEligibleDependants =
      assessment.workflowData.calculatedData.totalEligibleDependents;
    assessmentDTO.calculatedDataLivingCategory =
      assessment.workflowData.dmnValues?.livingCategory;

    // Set interface policy related calculated data.
    assessmentDTO.calculatedDataInterfacePolicyApplies =
      assessment.workflowData.calculatedData.interfacePolicyApplies;
    assessmentDTO.calculatedDataInterfaceChildCareCosts =
      assessment.workflowData.calculatedData.interfaceChildCareCosts;
    assessmentDTO.calculatedDataInterfaceTransportationAmount =
      assessment.workflowData.calculatedData.interfaceTransportationAmount;
    assessmentDTO.calculatedDataInterfaceAdditionalTransportationAmount =
      assessment.workflowData.calculatedData.interfaceAdditionalTransportationAmount;
    assessmentDTO.calculatedDataInterfaceNeed =
      assessment.workflowData.calculatedData.interfaceNeed;
    assessmentDTO.studentDataGovernmentFundingCosts =
      assessment.workflowData.studentData.governmentFundingCosts;
    if (assessmentDTO.calculatedDataInterfacePolicyApplies) {
      const interfaceTotalAssessedCost =
        (assessment.workflowData.calculatedData.interfaceEducationCosts ?? 0) +
        (assessment.workflowData.calculatedData.interfaceChildCareCosts ?? 0) +
        (assessment.workflowData.calculatedData.interfaceTransportationAmount ??
          0) +
        (assessment.workflowData.calculatedData
          .interfaceAdditionalTransportationAmount ?? 0);
      assessmentDTO.interfaceTotalAssessedCost = interfaceTotalAssessedCost;
    }

    return {
      assessment: assessmentDTO,
      applicationId: assessment.application.id,
      noaApprovalStatus: assessment.noaApprovalStatus,
      applicationStatus: assessment.application.applicationStatus,
      applicationNumber: assessment.application.applicationNumber,
      applicationCurrentAssessmentId:
        assessment.application.currentAssessment.id,
      fullName: getUserFullName(assessment.application.student.user),
      programName: assessment.offering.educationProgram.name,
      locationName: assessment.offering.institutionLocation.name,
      offeringName: assessment.offering.name,
      offeringIntensity: assessment.offering.offeringIntensity,
      offeringStudyStartDate: getDateOnlyFullMonthFormat(
        assessment.offering.studyStartDate,
      ),
      offeringStudyEndDate: getDateOnlyFullMonthFormat(
        assessment.offering.studyEndDate,
      ),
      eligibleAmount: getTotalDisbursementAmountFromSchedules(
        assessment.disbursementSchedules,
      ),
      disbursement: this.populateDisbursementAwardValues(
        assessment.disbursementSchedules,
        { maskMSFAA: options?.maskMSFAA },
      ),
    };
  }

  /**
   * Disbursement data is populated with dynamic key in a defined pattern to be compatible with form table.
   * @param disbursementSchedules disbursement schedule details.
   * @param options for NOA.
   * - `includeDocumentNumber` when true document number is mapped
   * to disbursement dynamic data.
   * - `includeDateSent` when true, date sent is mapped to disbursement dynamic data.
   * - `maskMSFAA` mask MSFAA or not.
   * @returns disbursement dynamic award data.
   */
  private populateDisbursementAwardValues(
    disbursementSchedules: DisbursementSchedule[],
    options?: {
      includeDocumentNumber?: boolean;
      includeDateSent?: boolean;
      maskMSFAA?: boolean;
    },
  ): DynamicAwardValue {
    // Setting default value.
    const includeDocumentNumber = options?.includeDocumentNumber ?? false;
    const includeDateSent = options?.includeDateSent ?? false;
    const maskMSFAA = options?.maskMSFAA ?? true;
    const disbursementDetails = {};
    disbursementSchedules.forEach((schedule, index) => {
      const disbursementIdentifier = `disbursement${index + 1}`;
      disbursementDetails[`${disbursementIdentifier}Date`] =
        getDateOnlyFullMonthFormat(schedule.disbursementDate);
      disbursementDetails[`${disbursementIdentifier}Status`] =
        schedule.disbursementScheduleStatus;
      disbursementDetails[`${disbursementIdentifier}COEStatus`] =
        schedule.coeStatus;
      disbursementDetails[`${disbursementIdentifier}MSFAANumber`] = maskMSFAA
        ? MASKED_MSFAA_NUMBER
        : schedule.msfaaNumber.msfaaNumber;
      disbursementDetails[`${disbursementIdentifier}MSFAAId`] =
        schedule.msfaaNumber.id;
      disbursementDetails[`${disbursementIdentifier}MSFAACancelledDate`] =
        schedule.msfaaNumber.cancelledDate;
      disbursementDetails[`${disbursementIdentifier}MSFAADateSigned`] =
        schedule.msfaaNumber.dateSigned;
      disbursementDetails[`${disbursementIdentifier}TuitionRemittance`] =
        schedule.tuitionRemittanceRequestedAmount;
      disbursementDetails[`${disbursementIdentifier}EnrolmentDate`] =
        schedule.coeUpdatedAt;
      disbursementDetails[`${disbursementIdentifier}Id`] = schedule.id;
      disbursementDetails[`${disbursementIdentifier}StatusUpdatedOn`] =
        schedule.disbursementScheduleStatusUpdatedOn;
      if (includeDateSent) {
        disbursementDetails[`${disbursementIdentifier}DateSent`] =
          schedule.dateSent;
      }
      if (includeDocumentNumber) {
        disbursementDetails[`${disbursementIdentifier}DocumentNumber`] =
          schedule.documentNumber;
      }
      schedule.disbursementValues.forEach((disbursement) => {
        if (disbursement.valueType === DisbursementValueType.BCTotalGrant) {
          // BC Total grants are not part of the students grants and should not be part of the summary.
          return;
        }
        const disbursementValueKey = `${disbursementIdentifier}${disbursement.valueCode.toLowerCase()}`;
        disbursementDetails[disbursementValueKey] = disbursement.valueAmount;
      });
    });
    return disbursementDetails;
  }

  /**
   * Get estimated and actual (if present) award details of an assessment.
   * @param assessmentId assessment to which awards details belong to.
   * @param options options,
   * - `studentId` studentId student to whom the award details belong to.
   * - `applicationId` application is used for authorization purposes to
   * ensure that a user has access to the specific application data.
   * - `includeDocumentNumber` when true document number is included in response.
   * - `includeDateSent` when true, date sent is included in response.
   * - `maskMSFAA` mask MSFAA or not.
   * @returns estimated and actual award details.
   */
  async getAssessmentAwardDetails(
    assessmentId: number,
    options?: {
      studentId?: number;
      applicationId?: number;
      includeDocumentNumber?: boolean;
      includeDateSent?: boolean;
      maskMSFAA?: boolean;
    },
  ): Promise<AwardDetailsAPIOutDTO> {
    // Setting default value.
    const includeDocumentNumber = options?.includeDocumentNumber ?? false;
    const includeDateSent = options?.includeDateSent ?? false;
    const maskMSFAA = options?.maskMSFAA ?? true;
    const assessment = await this.assessmentService.getAssessmentForNOA(
      assessmentId,
      options,
    );
    if (!assessment) {
      throw new NotFoundException("Assessment not found.");
    }

    const [firstDisbursementSchedule, secondDisbursementSchedule] =
      assessment.disbursementSchedules;

    // Get the eligible disbursements to be part of e-Cert generation
    // if either disbursement is pending.
    let firstEligibleDisbursement: EligibleECertDisbursement;
    let secondEligibleDisbursement: EligibleECertDisbursement;
    if (
      firstDisbursementSchedule?.disbursementScheduleStatus ===
        DisbursementScheduleStatus.Pending ||
      secondDisbursementSchedule?.disbursementScheduleStatus !==
        DisbursementScheduleStatus.Pending
    ) {
      [firstEligibleDisbursement, secondEligibleDisbursement] =
        await this.eCertGenerationService.getEligibleDisbursements({
          applicationId: assessment.application.id,
          allowNonCompleted: true,
        });
    }

    const firstDisbursement = await this.populateAwardDisbursement(
      firstDisbursementSchedule,
      firstEligibleDisbursement,
      assessment.application.student.id,
      { includeDocumentNumber, includeDateSent, maskMSFAA },
    );
    let secondDisbursement;
    if (secondDisbursementSchedule) {
      secondDisbursement = await this.populateAwardDisbursement(
        secondDisbursementSchedule,
        secondEligibleDisbursement,
        assessment.application.student.id,
        { includeDocumentNumber, includeDateSent, maskMSFAA },
      );
    }
    return {
      applicationNumber: assessment.application.applicationNumber,
      applicationStatus: assessment.application.applicationStatus,
      institutionName:
        assessment.offering.educationProgram.institution.operatingName,
      offeringIntensity: assessment.offering.offeringIntensity,
      offeringStudyStartDate: getDateOnlyFormat(
        assessment.offering.studyStartDate,
      ),
      offeringStudyEndDate: getDateOnlyFormat(assessment.offering.studyEndDate),
      firstDisbursement,
      secondDisbursement,
    };
  }

  /**
   * Populates estimated and actual (if present) award details for a disbursement schedule.
   * @param schedule the disbursement schedule.
   * @param studentId student to whom the award details belong to.
   * @param options options,
   * - `includeDocumentNumber` when true document number is included in response.
   * - `includeDateSent` when true, date sent is included in response.
   * - `maskMSFAA` mask MSFAA or not.
   * @returns estimated and actual award details.
   */
  private async populateAwardDisbursement(
    schedule: DisbursementSchedule,
    eligibleDisbursement: EligibleECertDisbursement,
    studentId: number,
    options?: {
      includeDocumentNumber?: boolean;
      includeDateSent?: boolean;
      maskMSFAA?: boolean;
    },
  ): Promise<AwardDisbursementScheduleAPIOutDTO> {
    // Setting default value.
    const includeDocumentNumber = options?.includeDocumentNumber ?? false;
    const includeDateSent = options?.includeDateSent ?? false;
    const maskMSFAA = options?.maskMSFAA ?? true;

    const disbursement = new AwardDisbursementScheduleAPIOutDTO();

    disbursement.disbursementDate = getDateOnlyFullMonthFormat(
      schedule.disbursementDate,
    );
    disbursement.status = schedule.disbursementScheduleStatus;
    disbursement.coeStatus = schedule.coeStatus;
    disbursement.msfaaNumber = maskMSFAA
      ? MASKED_MSFAA_NUMBER
      : schedule.msfaaNumber.msfaaNumber;
    disbursement.msfaaId = schedule.msfaaNumber.id;
    disbursement.msfaaCancelledDate = schedule.msfaaNumber.cancelledDate;
    disbursement.msfaaDateSigned = schedule.msfaaNumber.dateSigned;
    disbursement.tuitionRemittance = schedule.tuitionRemittanceRequestedAmount;
    disbursement.enrolmentDate = schedule.coeUpdatedAt;
    disbursement.id = schedule.id;
    disbursement.statusUpdatedOn = schedule.disbursementScheduleStatusUpdatedOn;
    if (includeDateSent) {
      disbursement.dateSent = schedule.dateSent;
    }
    if (includeDocumentNumber) {
      disbursement.documentNumber = schedule.documentNumber;
    }

    disbursement.receiptReceived = schedule.disbursementReceipts?.length > 0;

    // Lookup Overawards and Restrictions if only estimated awards are available.
    let studentOverwardBalances: AwardOverawardBalance;
    let studentRestrictions: Map<DisbursementValueType, ActiveRestriction[]>;
    if (disbursement.status === DisbursementScheduleStatus.Pending) {
      const overawardBalances =
        await this.disbursementOverawardService.getOverawardBalance([
          studentId,
        ]);
      studentOverwardBalances = overawardBalances[studentId];

      studentRestrictions =
        getStopFundingTypesAndRestrictionsMap(eligibleDisbursement);
    }

    // Populate disbursement values.
    const disbursementValues: AwardDisbursementValueAPIOutDTO[] = [];
    disbursement.disbursementValues = disbursementValues;
    schedule.disbursementValues.forEach((disbursementValue) => {
      if (disbursementValue.valueType === DisbursementValueType.BCTotalGrant) {
        // BC Total grants are not part of the students grants and should not be part of the summary.
        return;
      }
      const awardDisbursementValue = new AwardDisbursementValueAPIOutDTO();
      awardDisbursementValue.valueCode = disbursementValue.valueCode;
      awardDisbursementValue.valueType = disbursementValue.valueType;
      awardDisbursementValue.valueAmount = disbursementValue.valueAmount;
      awardDisbursementValue.effectiveAmount =
        disbursementValue.effectiveAmount;

      let hasDisbursedAdjustment = false;
      let hasNegativeOverawardAdjustment = false;
      let hasPositiveOverawardAdjustment = false;
      let hasRestrictionAdjustment = false;

      if (disbursement.status === DisbursementScheduleStatus.Pending) {
        // Estimated Award - calculate estimated adjustments.

        // Restriction: If the student has a restriction that impacts funding, display the tag beside it.
        // Stop full time BC loan: BCSL
        // Stop full time BC grant: BCAG (FT), SBSD (FT), BGPD
        // Stop part time BC grant: BCAG (PT), SBSD (PT)
        hasRestrictionAdjustment = studentRestrictions.has(
          disbursementValue.valueType,
        );
        // Overaward: If there is a positive overaward balance for that award type, display the tag beside it.
        const overawardBalance =
          studentOverwardBalances[disbursementValue.valueCode];
        if (overawardBalance > 0) {
          hasPositiveOverawardAdjustment = true;
        }

        // Funded: If a previous assessment in the application has disbursed that award type, display the tag beside it.
        hasDisbursedAdjustment =
          disbursementValue.disbursedAmountSubtracted > 0;
      } else {
        // Final Award - use actual subtracted amounts.
        hasRestrictionAdjustment =
          disbursementValue.restrictionAmountSubtracted > 0;
        hasDisbursedAdjustment =
          disbursementValue.disbursedAmountSubtracted > 0;
        hasNegativeOverawardAdjustment =
          disbursementValue.overawardAmountSubtracted > 0;
        hasPositiveOverawardAdjustment =
          disbursementValue.overawardAmountSubtracted < 0;
      }
      awardDisbursementValue.hasDisbursedAdjustment = hasDisbursedAdjustment;
      awardDisbursementValue.hasNegativeOverawardAdjustment =
        hasNegativeOverawardAdjustment;
      awardDisbursementValue.hasPositiveOverawardAdjustment =
        hasPositiveOverawardAdjustment;
      awardDisbursementValue.hasRestrictionAdjustment =
        hasRestrictionAdjustment;

      disbursementValues.push(awardDisbursementValue);
    });
    return disbursement;
  }

  /**
   * Get all pending and denied appeals for an application.
   * @param applicationId application to which the requests are retrieved.
   * @param studentId applicant student.
   * @returns pending and denied appeals.
   */
  async getPendingAndDeniedAppeals(
    applicationId: number,
    studentId?: number,
  ): Promise<RequestAssessmentSummaryAPIOutDTO[]> {
    const studentAppeal =
      await this.studentAppealService.getPendingAndDeniedAppeals(
        applicationId,
        studentId,
      );
    const studentAppealArray: RequestAssessmentSummaryAPIOutDTO[] =
      studentAppeal.map((appeals) => ({
        id: appeals.id,
        submittedDate: appeals.submittedDate,
        status: appeals.status,
        requestType: RequestAssessmentTypeAPIOutDTO.StudentAppeal,
      }));
    return studentAppealArray;
  }

  /**
   * Get history of approved assessment requests and
   * unsuccessful scholastic standings change requests(which will not create new assessment)
   * for an application.
   * @param applicationId, application id.
   * @param studentId applicant student.
   * @returns summary of the assessment history for a student application.
   */
  async getAssessmentHistorySummary(
    applicationId: number,
    studentId?: number,
  ): Promise<AssessmentHistorySummaryAPIOutDTO[]> {
    const [assessments, unsuccessfulScholasticStandings] = await Promise.all([
      this.assessmentService.assessmentHistorySummary(applicationId, studentId),
      this.studentScholasticStandingsService.getUnsuccessfulScholasticStandings(
        applicationId,
        studentId,
      ),
    ]);
    const history: AssessmentHistorySummaryAPIOutDTO[] = assessments.map(
      (assessment) => ({
        assessmentId: assessment.id,
        submittedDate: assessment.submittedDate,
        triggerType: assessment.triggerType,
        assessmentDate: assessment.assessmentDate,
        status: assessment.studentAssessmentStatus,
        offeringId: assessment.offering.id,
        programId: assessment.offering.educationProgram.id,
        studentAppealId: assessment.studentAppeal?.id,
        applicationOfferingChangeRequestId:
          assessment.applicationOfferingChangeRequest?.id,
        applicationExceptionId: assessment.application.applicationException?.id,
        studentScholasticStandingId: assessment.studentScholasticStanding?.id,
        scholasticStandingChangeType:
          assessment.studentScholasticStanding?.changeType,
        scholasticStandingReversalDate:
          assessment.studentScholasticStanding?.reversalDate,
      }),
    );
    const unsuccessfulScholasticStandingHistory =
      unsuccessfulScholasticStandings.map((scholasticStanding) => ({
        submittedDate: scholasticStanding.submittedDate,
        triggerType: AssessmentTriggerType.ScholasticStandingChange,
        // For unsuccessful scholastic standing, status is always "completed".
        status: StudentAssessmentStatus.Completed,
        studentScholasticStandingId: scholasticStanding.id,
        hasUnsuccessfulWeeks: true,
        scholasticStandingChangeType: scholasticStanding.changeType,
        scholasticStandingReversalDate: scholasticStanding.reversalDate,
      }));
    history.push(...unsuccessfulScholasticStandingHistory);
    history.sort(this.sortAssessmentHistory);
    return history;
  }

  /**
   * Get all pending and declined requests related to an application which would result in
   * a new assessment when that request is approved.
   * @param applicationId application id.
   * @param options options for request assessments,
   * - `studentId` student id.
   * - `includeOfferingChanges` will decide whether to include assessment
   * request for offering change.
   * @returns assessment requests or exceptions for the student application.
   */
  async requestedStudentAssessmentSummary(
    applicationId: number,
    options?: {
      studentId?: number;
      includeOfferingChanges?: boolean;
    },
  ): Promise<RequestAssessmentSummaryAPIOutDTO[]> {
    const requestAssessmentSummary: RequestAssessmentSummaryAPIOutDTO[] = [];
    if (options?.includeOfferingChanges) {
      const offeringChange =
        await this.educationProgramOfferingService.getOfferingRequestsByApplicationId(
          applicationId,
          options?.studentId,
        );
      if (offeringChange) {
        requestAssessmentSummary.push({
          id: offeringChange.id,
          submittedDate: offeringChange.submittedDate,
          status: offeringChange.offeringStatus,
          requestType: RequestAssessmentTypeAPIOutDTO.OfferingRequest,
          programId: offeringChange.educationProgram.id,
        });
      }
    }
    const applicationExceptions =
      await this.applicationExceptionService.getExceptionsByApplicationId(
        applicationId,
        options?.studentId,
        ApplicationExceptionStatus.Pending,
        ApplicationExceptionStatus.Declined,
      );
    // When a pending or denied application exception exist then no other request can exist
    // for the given application.
    if (applicationExceptions.length > 0) {
      const applicationExceptionArray: RequestAssessmentSummaryAPIOutDTO[] =
        applicationExceptions.map((applicationException) => ({
          id: applicationException.id,
          submittedDate: applicationException.createdAt,
          status: applicationException.exceptionStatus,
          requestType: RequestAssessmentTypeAPIOutDTO.StudentException,
        }));
      return requestAssessmentSummary.concat(applicationExceptionArray);
    }
    const appeals = await this.getPendingAndDeniedAppeals(
      applicationId,
      options?.studentId,
    );
    const applicationOfferingChangeRequests =
      await this.getApplicationOfferingChangeRequestsByStatus(
        applicationId,
        [
          ApplicationOfferingChangeRequestStatus.InProgressWithStudent,
          ApplicationOfferingChangeRequestStatus.InProgressWithSABC,
          ApplicationOfferingChangeRequestStatus.DeclinedByStudent,
          ApplicationOfferingChangeRequestStatus.DeclinedBySABC,
        ],
        { studentId: options?.studentId },
      );
    return requestAssessmentSummary
      .concat(appeals)
      .concat(applicationOfferingChangeRequests)
      .sort(this.sortAssessmentHistory);
  }

  /**
   * Get all the Application Offering Change Requests for the provided application id filtered by the application offering change request statuses.
   * @param applicationId the application id.
   * @param applicationOfferingChangeRequestStatuses list of application offering change request statuses.
   * @param options method options.
   * - `studentId` student id.
   * @returns application offering change requests.
   */
  async getApplicationOfferingChangeRequestsByStatus(
    applicationId: number,
    applicationOfferingChangeRequestStatuses: ApplicationOfferingChangeRequestStatus[],
    options?: {
      studentId?: number;
    },
  ): Promise<RequestAssessmentSummaryAPIOutDTO[]> {
    const filteredApplicationOfferingChangeRequests =
      await this.applicationOfferingChangeRequestService.getApplicationOfferingChangeRequestsByStatus(
        applicationId,
        applicationOfferingChangeRequestStatuses,
        {
          studentId: options?.studentId,
        },
      );
    return filteredApplicationOfferingChangeRequests.map((request) => ({
      id: request.id,
      submittedDate: request.createdAt,
      status: request.applicationOfferingChangeRequestStatus,
      requestType:
        RequestAssessmentTypeAPIOutDTO.ApplicationOfferingChangeRequest,
    }));
  }

  /**
   * Helper function to sort assessment history by descending submitted date.
   * @param first first assessment.
   * @param second second assessment.
   * @returns the difference of the second submitted date minus the first submitted date in milliseconds.
   */
  sortAssessmentHistory(
    first: { submittedDate: Date },
    second: { submittedDate: Date },
  ): number {
    return second.submittedDate.getTime() - first.submittedDate.getTime();
  }
}
