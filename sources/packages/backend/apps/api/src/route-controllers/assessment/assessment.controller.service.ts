import {
  DisbursementSchedule,
  COEStatus,
  DisbursementReceipt,
  AssessmentTriggerType,
  ApplicationExceptionStatus,
  StudentAssessmentStatus,
  ApplicationOfferingChangeRequestStatus,
  DisbursementValueType,
  RECEIPT_FUNDING_TYPE_PROVINCIAL,
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
} from "../../services";
import {
  AssessmentNOAAPIOutDTO,
  AwardDetailsAPIOutDTO,
  RequestAssessmentSummaryAPIOutDTO,
  RequestAssessmentTypeAPIOutDTO,
  AssessmentHistorySummaryAPIOutDTO,
} from "./models/assessment.dto";
import { getUserFullName } from "../../utilities";
import { getDateOnlyFormat } from "@sims/utilities";
import { BC_TOTAL_GRANT_AWARD_CODE } from "@sims/services/constants";

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
   * @returns notice of assessment data.
   */
  async getAssessmentNOA(
    assessmentId: number,
    options?: {
      studentId?: number;
      applicationId?: number;
      maskMSFAA?: boolean;
    },
  ): Promise<AssessmentNOAAPIOutDTO> {
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

    return {
      assessment: assessment.assessmentData,
      applicationId: assessment.application.id,
      noaApprovalStatus: assessment.noaApprovalStatus,
      applicationStatus: assessment.application.applicationStatus,
      applicationNumber: assessment.application.applicationNumber,
      fullName: getUserFullName(assessment.application.student.user),
      programName: assessment.offering.educationProgram.name,
      locationName: assessment.offering.institutionLocation.name,
      offeringIntensity: assessment.offering.offeringIntensity,
      offeringStudyStartDate: getDateOnlyFormat(
        assessment.offering.studyStartDate,
      ),
      offeringStudyEndDate: getDateOnlyFormat(assessment.offering.studyEndDate),
      eligibleAmount: this.sumDisbursementValueAmounts(
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
   * - `maskMSFAA` mask MSFAA or not.
   * @returns disbursement dynamic award data.
   */
  private populateDisbursementAwardValues(
    disbursementSchedules: DisbursementSchedule[],
    options?: {
      includeDocumentNumber?: boolean;
      maskMSFAA?: boolean;
    },
  ): Record<string, string | number> {
    // Setting default value.
    const includeDocumentNumber = options?.includeDocumentNumber ?? false;
    const maskMSFAA = [true, false].includes(options?.maskMSFAA)
      ? options.maskMSFAA
      : true;
    const disbursementDetails = {};
    disbursementSchedules.forEach((schedule, index) => {
      const disbursementIdentifier = `disbursement${index + 1}`;
      disbursementDetails[`${disbursementIdentifier}Date`] = getDateOnlyFormat(
        schedule.disbursementDate,
      );
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
      disbursementDetails[`${disbursementIdentifier}Id`] = schedule.id;
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
   * Calculate the sum of value amount for each disbursement value within the disbursement schedules.
   * @param disbursementSchedules disbursement schedule details.
   * @returns The total sum of value amount across all disbursement schedules.
   */
  private sumDisbursementValueAmounts(
    disbursementSchedules: DisbursementSchedule[],
  ): number {
    return disbursementSchedules
      .flatMap(
        (disbursementSchedule) => disbursementSchedule.disbursementValues,
      )
      .reduce(
        (accumulator, disbursementValue) =>
          accumulator + disbursementValue.valueAmount,
        0,
      );
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
   * @returns estimated and actual award details.
   */
  async getAssessmentAwardDetails(
    assessmentId: number,
    includeDocumentNumber = false,
    options?: {
      studentId?: number;
      applicationId?: number;
    },
  ): Promise<AwardDetailsAPIOutDTO> {
    const assessment = await this.assessmentService.getAssessmentForNOA(
      assessmentId,
      options,
    );

    if (!assessment) {
      throw new NotFoundException("Assessment not found.");
    }
    const estimatedAward = this.populateDisbursementAwardValues(
      assessment.disbursementSchedules,
      { includeDocumentNumber },
    );
    const [firstDisbursement, secondDisbursement] =
      assessment.disbursementSchedules;
    let finalAward: Record<string, string | number> = undefined;
    // Populate the final awards in a dynamic way like disbursement schedule(estimated) awards.
    if (firstDisbursement.coeStatus === COEStatus.completed) {
      const disbursementReceipts =
        await this.disbursementReceiptService.getDisbursementReceiptByAssessment(
          assessmentId,
          options,
        );
      if (disbursementReceipts.length) {
        finalAward = this.populateDisbursementReceiptAwardValues(
          disbursementReceipts,
          firstDisbursement,
          "disbursementReceipt1",
        );
        if (secondDisbursement) {
          const secondDisbursementReceiptAwards =
            this.populateDisbursementReceiptAwardValues(
              disbursementReceipts,
              secondDisbursement,
              "disbursementReceipt2",
            );
          finalAward = { ...finalAward, ...secondDisbursementReceiptAwards };
        }
      }
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
      estimatedAward,
      finalAward,
    };
  }

  /**
   * Populate the final awards in a dynamic way like disbursement schedule(estimated) awards.
   * @param disbursementReceipts disbursement receipt details.
   * @param disbursementScheduleId disbursement schedule id of the disbursement receipt(s).
   * @param identifier identifier which is used to create dynamic data by appending award code
   * to it.
   * @returns dynamic award data of disbursement receipts of a given disbursement.
   * @example
   * finalAward: {
   *    disbursementReceipt1cslf: 1000,
   *    disbursementReceipt1csgp: 10001,
   *    disbursementReceipt1bcsl: 1005,
   *    disbursementReceipt1bcag: 1006,
   *    disbursementReceipt1bgpd: 1007,
   *    disbursementReceipt1sbsd: 1008,
   *    disbursementReceipt2cslf: 1000,
   *    disbursementReceipt2csgp: 10001,
   *    disbursementReceipt2bcsl: 1005,
   *    disbursementReceipt2bcag: 1006,
   *    disbursementReceipt2bgpd: 1007,
   *    disbursementReceipt2sbsd: 1008,
      }
   */
  private populateDisbursementReceiptAwardValues(
    disbursementReceipts: DisbursementReceipt[],
    disbursementSchedule: DisbursementSchedule,
    identifier: string,
  ): Record<string, string | number> {
    const finalAward = {};
    // Add all estimated awards to the list of receipts returned.
    // Ensure that every estimated disbursement will be part of the summary.
    disbursementSchedule.disbursementValues.forEach((award) => {
      if (award.valueType === DisbursementValueType.BCTotalGrant) {
        // BC Total grants are not part of the students grants and should not be part of the summary.
        return;
      }
      const disbursementValueKey = this.createReceiptFullIdentifier(
        identifier,
        award.valueCode,
      );
      finalAward[disbursementValueKey] = null;
    });
    // Process the two expected receipts records for federal(FE) and the other for provincial(BC) awards.
    disbursementReceipts
      .filter(
        (receipt) =>
          receipt.disbursementSchedule.id === disbursementSchedule.id,
      )
      .forEach((receipt) => {
        // Check if a loan is part of the receipt (e.g. part-time provincial loans shouldn't be available).
        const loanType = DisbursementReceiptService.getLoanAwardCode(
          receipt.fundingType,
          receipt.disbursementSchedule.studentAssessment.offering
            .offeringIntensity,
        );
        if (loanType) {
          // Add the loan to the list of awards returned.
          const disbursementLoanKey = `${identifier}${loanType.toLowerCase()}`;
          finalAward[disbursementLoanKey] = receipt.totalDisbursedAmount;
        }
        // Populate the receipt amount in the receipt awards.
        // If an estimated disbursement award has no equivalent receipt its value will be left as null.
        receipt.disbursementReceiptValues.forEach((receiptValue) => {
          if (receiptValue.grantType === BC_TOTAL_GRANT_AWARD_CODE) {
            // BC Total grants are not part of the students grants and should not be part of the summary.
            return;
          }
          const disbursementValueKey = this.createReceiptFullIdentifier(
            identifier,
            receiptValue.grantType,
          );
          finalAward[disbursementValueKey] = receiptValue.grantAmount;
        });
        if (receipt.fundingType === RECEIPT_FUNDING_TYPE_PROVINCIAL) {
          // Create individual BC grants values from BC total grants(BCSG) receipt.
          // Federal receipts do not contain individual BC grants.
          const bcTotalGrantAward =
            disbursementSchedule.disbursementValues.find(
              (award) => award.valueCode === BC_TOTAL_GRANT_AWARD_CODE,
            );
          // If the BC total grants award is not present consider that BC grants were
          // not eligible and do not need to be returned.
          if (bcTotalGrantAward) {
            const bcTotalGrantsReceipt = receipt.disbursementReceiptValues.find(
              (receipt) => receipt.grantType === BC_TOTAL_GRANT_AWARD_CODE,
            );
            // Check if the BC total grants and the receipt have the some total hence.
            // If the values match the award values from the BC grants can be copied to the summary.
            const bcGrantsReceiptMatch =
              bcTotalGrantAward?.valueAmount ===
              bcTotalGrantsReceipt?.grantAmount;
            const bcGrants = disbursementSchedule.disbursementValues.filter(
              (award) => award.valueType === DisbursementValueType.BCGrant,
            );
            bcGrants.forEach((bcGrant) => {
              const disbursementValueKey = this.createReceiptFullIdentifier(
                identifier,
                bcGrant.valueCode,
              );
              finalAward[disbursementValueKey] = bcGrantsReceiptMatch
                ? bcGrant.valueAmount
                : null;
            });
          }
        }
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
   * unsuccessful scholastic standing change requests(which will not create new assessment)
   * for an application.
   * @param applicationId, application id.
   * @param studentId applicant student.
   * @returns summary of the assessment history for a student application.
   */
  async getAssessmentHistorySummary(
    applicationId: number,
    studentId?: number,
  ): Promise<AssessmentHistorySummaryAPIOutDTO[]> {
    const [assessments, unsuccessfulScholasticStanding] = await Promise.all([
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
      }),
    );
    // Add unsuccessful scholastic standing to the top of the list, if present.
    // For unsuccessful scholastic standing, status is always "completed" and
    // "createdAt" is "submittedDate".
    if (unsuccessfulScholasticStanding) {
      history.unshift({
        submittedDate: unsuccessfulScholasticStanding.createdAt,
        triggerType: AssessmentTriggerType.ScholasticStandingChange,
        status: StudentAssessmentStatus.Completed,
        studentScholasticStandingId: unsuccessfulScholasticStanding.id,
        hasUnsuccessfulWeeks: true,
      });
    }

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
