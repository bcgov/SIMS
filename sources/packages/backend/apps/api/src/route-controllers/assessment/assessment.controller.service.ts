import {
  DisbursementSchedule,
  AssessmentTriggerType,
  ApplicationExceptionStatus,
  StudentAssessmentStatus,
  ApplicationOfferingChangeRequestStatus,
  DisbursementValueType,
  StudentAssessment,
  DisbursementValue,
  DisbursementScheduleStatus,
} from "@sims/sims-db";
import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  StudentAssessmentService,
  DisbursementReceiptService,
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
  AwardDetailsAPIOutDTO,
  RequestAssessmentSummaryAPIOutDTO,
  RequestAssessmentTypeAPIOutDTO,
  AssessmentHistorySummaryAPIOutDTO,
  DynamicAwardValue,
  AssessmentAPIOutDTO,
} from "./models/assessment.dto";
import { getUserFullName } from "../../utilities";
import {
  getDateOnlyFormat,
  getDateOnlyFullMonthFormat,
  getTotalDisbursementAmountFromSchedules,
} from "@sims/utilities";

/**
 * Final award value dynamic identifier prefix.
 */
const DISBURSEMENT_RECEIPT_PREFIX = "disbursementReceipt";

/**
 * Suffixes for dynamic fields to track subtracted amounts.
 */
const DISBURSED_SUBTRACTED_SUFFIX = "DisbursedAmountSubtracted";
const OVERAWARD_SUBTRACTED_SUFFIX = "OverawardAmountSubtracted";
const RESTRICTION_SUBTRACTED_SUFFIX = "RestrictionAmountSubtracted";

/**
 * Indicates which disbursement schedule statuses are expected to have receipts generated.
 * When 'Sent' and later 'Rejected', the receipt should not be received in a usual situation.
 * Either way, both status are considered as subjected to check for receipts since an
 * e-Cert was produced.
 */
const HAS_POTENTIAL_RECEIPT_STATUSES = new Set([
  DisbursementScheduleStatus.Sent,
  DisbursementScheduleStatus.Rejected,
]);

@Injectable()
export class AssessmentControllerService {
  constructor(
    private readonly assessmentService: StudentAssessmentService,
    private readonly disbursementReceiptService: DisbursementReceiptService,
    private readonly studentAppealService: StudentAppealService,
    private readonly studentScholasticStandingsService: StudentScholasticStandingsService,
    private readonly educationProgramOfferingService: EducationProgramOfferingService,
    private readonly applicationExceptionService: ApplicationExceptionService,
    private readonly applicationOfferingChangeRequestService: ApplicationOfferingChangeRequestService,
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
   * Get estimated and actual(if present) award details of an assessment.
   * @param assessmentId assessment to which awards details belong to.
   * @param includeDocumentNumber when true document number is mapped
   * to disbursement dynamic data.
   * @param options options,
   * - `studentId` studentId student to whom the award details belong to.
   * - `applicationId` application is used for authorization purposes to
   * ensure that a user has access to the specific application data.
   * - `includeDocumentNumber` when true document number is mapped
   * to disbursement dynamic data.
   * - `includeDateSent` when true, date sent is mapped to disbursement dynamic data.
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
    const estimatedAward = this.populateDisbursementAwardValues(
      assessment.disbursementSchedules,
      { includeDocumentNumber, includeDateSent, maskMSFAA },
    );
    const finalAward = await this.populateDisbursementFinalAwardsValues(
      assessment,
      options,
    );
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
      estimatedAward,
      finalAward,
    };
  }

  /**
   * Populate the final awards in a dynamic way like disbursement schedule(estimated) awards.
   * @param assessment student assessment.
   * @param options options,
   * - `studentId` studentId student to whom the award details belong to.
   * - `applicationId` application is used for authorization purposes to
   * ensure that a user has access to the specific application data.
   * @returns dynamic award data of disbursement receipts of a given disbursement.
   */
  private async populateDisbursementFinalAwardsValues(
    assessment: StudentAssessment,
    options?: {
      studentId?: number;
      applicationId?: number;
    },
  ): Promise<DynamicAwardValue | undefined> {
    const [firstDisbursement] = assessment.disbursementSchedules;
    if (
      !HAS_POTENTIAL_RECEIPT_STATUSES.has(
        firstDisbursement.disbursementScheduleStatus,
      )
    ) {
      // If a e-Cert was never generated no additional processing is needed.
      return undefined;
    }
    let finalAward: DynamicAwardValue = {};
    // Final award values come from the e-Cert effective amounts but the disbursement receipts
    // are still required to determine if a student disbursement can be cancelled.
    const disbursementReceipts =
      await this.disbursementReceiptService.getDisbursementReceiptByAssessment(
        assessment.id,
        options,
      );
    // Populate the disbursementReceipt[n]Received flags for each disbursement schedule.
    assessment.disbursementSchedules.forEach((schedule, index) => {
      const hasReceipt = disbursementReceipts.some(
        (receipt) => receipt.disbursementSchedule.id === schedule.id,
      );
      this.setReceiptReceivedFlag(finalAward, index + 1, hasReceipt);
    });

    // Obtain final awards from e-Cert effective amounts for both Part-time and Full-time assessments.
    let index = 1;
    for (const schedule of assessment.disbursementSchedules) {
      if (
        !HAS_POTENTIAL_RECEIPT_STATUSES.has(schedule.disbursementScheduleStatus)
      ) {
        break;
      }
      this.setHasAwardsFlag(finalAward, index, true);
      const awards = this.populateDisbursementECertAwardValues(
        schedule.disbursementValues,
        `${DISBURSEMENT_RECEIPT_PREFIX}${index}`,
      );
      finalAward = { ...finalAward, ...awards };
      index++;
    }
    return finalAward;
  }

  /**
   * Creates the  receipt received flag that indicates if a receipt was received
   * for a specific disbursement schedule.
   * This flag will be true if any receipt (Federal or Provincial) was received.
   * @param finalAwards dynamic award values to have the flag set.
   * @param index disbursement schedule index.
   * @param flag indicates if awards were added to the final award.
   */
  private setReceiptReceivedFlag(
    finalAwards: DynamicAwardValue,
    index: number,
    flag: boolean,
  ): void {
    const identifier = `${DISBURSEMENT_RECEIPT_PREFIX}${index}Received`;
    finalAwards[identifier] = flag;
  }

  /**
   * Creates the has awards flag for a specific disbursement schedule
   * to indicate if awards were added.
   * For a full-time assessment, this flag will be set to true if any awards
   * were found in the disbursement receipts.
   * For a part-time application it will be awarded based on the e-Cert values.
   * @param finalAwards dynamic award values to have the flag set.
   * @param index disbursement schedule index.
   * @param flag indicates if awards were added to the final award.
   */
  private setHasAwardsFlag(
    finalAwards: DynamicAwardValue,
    index: number,
    flag: boolean,
  ): void {
    const identifier = `${DISBURSEMENT_RECEIPT_PREFIX}${index}HasAwards`;
    finalAwards[identifier] = flag;
  }

  /**
   * Populate final awards values from e-Cert effective values.
   * @param disbursementValues disbursement values with the effective amounts used to generate the e-Cert.
   * @param identifier identifier which is used to create dynamic data by appending award code to it.
   * @returns dynamic award data of disbursement receipts of a given disbursement.
   */
  private populateDisbursementECertAwardValues(
    disbursementValues: DisbursementValue[],
    identifier: string,
  ): DynamicAwardValue {
    const finalAward: DynamicAwardValue = {};
    disbursementValues.forEach((award) => {
      if (award.valueType === DisbursementValueType.BCTotalGrant) {
        // BC Total grants are not part of the students grants and should not be part of the summary.
        return;
      }
      const disbursementValueKey = this.createReceiptFullIdentifier(
        identifier,
        award.valueCode,
      );
      finalAward[disbursementValueKey] = award.effectiveAmount;

      // Populate subtracted amounts.
      const disbursedAmountSubtractedKey = `${disbursementValueKey}${DISBURSED_SUBTRACTED_SUFFIX}`;
      finalAward[disbursedAmountSubtractedKey] =
        award.disbursedAmountSubtracted ?? undefined;
      const overawardAmountSubtractedKey = `${disbursementValueKey}${OVERAWARD_SUBTRACTED_SUFFIX}`;
      finalAward[overawardAmountSubtractedKey] =
        award.overawardAmountSubtracted ?? undefined;
      const restrictionAmountSubtractedKey = `${disbursementValueKey}${RESTRICTION_SUBTRACTED_SUFFIX}`;
      finalAward[restrictionAmountSubtractedKey] =
        award.restrictionAmountSubtracted ?? undefined;
    });
    return finalAward;
  }

  /**
   * Create the unique property name to represent the receipt values for each award.
   * @param identifierPrefix prefix to be used for all properties.
   * @param uniqueCode code to uniquely identify the property (e.g. CSLF, BCAG, BCSL).
   * @returns returns the unique identifier (e.g. disbursementReceipt1cslf).
   */
  private createReceiptFullIdentifier(
    identifierPrefix: string,
    uniqueCode: string,
  ): string {
    return `${identifierPrefix}${uniqueCode.toLowerCase()}`;
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
