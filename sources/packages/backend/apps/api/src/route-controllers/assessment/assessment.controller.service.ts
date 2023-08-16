import {
  DisbursementSchedule,
  COEStatus,
  DisbursementReceipt,
  AssessmentTriggerType,
  ApplicationExceptionStatus,
  StudentAssessmentStatus,
  ApplicationOfferingChangeRequestStatus,
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
    let finalAward = {};
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
          firstDisbursement.id,
          "disbursementReceipt1",
        );
        if (secondDisbursement) {
          const secondDisbursementReceiptAwards =
            this.populateDisbursementReceiptAwardValues(
              disbursementReceipts,
              secondDisbursement.id,
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
   * @param identifier identifier which is used to create dynamic data by appending grant code
   * to it.
   * @returns dynamic award data of disbursement receipts of a given disbursement.
   */
  private populateDisbursementReceiptAwardValues(
    disbursementReceipts: DisbursementReceipt[],
    disbursementScheduleId: number,
    identifier: string,
  ): Record<string, string | number> {
    const finalAward = {};
    disbursementReceipts
      .filter(
        (receipt) => receipt.disbursementSchedule.id === disbursementScheduleId,
      )
      .forEach((receipt) => {
        finalAward[`${identifier}Id`] = receipt.id;
        receipt.disbursementReceiptValues.forEach((receiptValue) => {
          const disbursementValueKey = `${identifier}${receiptValue.grantType.toLowerCase()}`;
          finalAward[disbursementValueKey] = receiptValue.grantAmount;
        });
      });
    return finalAward;
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
        status: assessment.status,
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
   * Get all pending and declined requests related to an application which would result
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
    return requestAssessmentSummary.concat(appeals);
  }

  /**
   * Get all the Application Offering Change Requests for the provided application id filtered by the application offering change request statuses.
   * @param applicationId the application id.
   * @param studentId the student id.
   * @param applicationOfferingChangeRequestStatuses list of application offering change request statuses.
   * @returns application offering change requests.
   */
  async getApplicationOfferingChangeRequestsByStatus(
    applicationId: number,
    studentId: number,
    applicationOfferingChangeRequestStatuses: ApplicationOfferingChangeRequestStatus[],
  ): Promise<RequestAssessmentSummaryAPIOutDTO[]> {
    const filteredApplicationOfferingChangeRequests =
      await this.applicationOfferingChangeRequestService.getApplicationOfferingChangeRequestsByStatus(
        applicationId,
        studentId,
        applicationOfferingChangeRequestStatuses,
      );
    return filteredApplicationOfferingChangeRequests.map((request) => ({
      id: request.id,
      submittedDate: request.createdAt,
      status: request.applicationOfferingChangeRequestStatus,
      requestType:
        RequestAssessmentTypeAPIOutDTO.ApplicationOfferingChangeRequest,
    }));
  }
}
