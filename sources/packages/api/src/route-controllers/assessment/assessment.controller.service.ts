import {
  CRAIncomeVerification,
  StudentAppealRequest,
  SupportingUser,
  SupportingUserType,
  DisbursementSchedule,
  COEStatus,
  DisbursementReceipt,
  ApplicationExceptionStatus,
  AssessmentTriggerType,
} from "../../database/entities";
import {
  StudentAppealRequestAPIOutDTO,
  SupportingUserAPIOutDTO,
} from "./models/assessment.system-access.dto";
import { DynamicAPIOutDTO } from "../models/common.dto";
import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  StudentAssessmentService,
  DisbursementReceiptService,
  EducationProgramOfferingService,
  ApplicationExceptionService,
  StudentAppealService,
  StudentScholasticStandingsService,
} from "../../services";
import {
  AssessmentNOAAPIOutDTO,
  AwardDetailsAPIOutDTO,
  RequestAssessmentSummaryAPIOutDTO,
  RequestAssessmentTypeAPIOutDTO,
  AssessmentHistorySummaryAPIOutDTO,
} from "./models/assessment.dto";
import { getDateOnlyFormat, getUserFullName } from "../../utilities";
import { StudentAssessmentStatus } from "../../services/student-assessment/student-assessment.models";

@Injectable()
export class AssessmentControllerService {
  constructor(
    private readonly assessmentService: StudentAssessmentService,
    private readonly disbursementReceiptService: DisbursementReceiptService,
    private readonly educationProgramOfferingService: EducationProgramOfferingService,
    private readonly applicationExceptionService: ApplicationExceptionService,
    private readonly studentAppealService: StudentAppealService,
    private readonly studentScholasticStandingsService: StudentScholasticStandingsService,
  ) {}

  /**
   * Converts an array with supporting users to an object where every user
   * will be a property. This will keep the supporting users dynamic (it can be
   * extended to have a Parent3, Partner2 or even more types) and make easier to
   * read and process these users in the workflow.
   * @param supportingUsers supporting users to be converted.
   * @param incomeVerifications available income verifications associated with
   * the application associated with the supporting users.
   * @returns object where every user is a property.
   */
  flattenSupportingUsersArray(
    supportingUsers: SupportingUser[],
    incomeVerifications?: CRAIncomeVerification[],
  ): DynamicAPIOutDTO<SupportingUserAPIOutDTO> {
    if (!supportingUsers?.length) {
      return null;
    }
    // Ensures that the users will be always ordered in the same way.
    supportingUsers.sort((userA, userB) => (userA.id > userB.id ? 1 : -1));
    // Object to be returned.
    const flattenedSupportingUsers =
      {} as DynamicAPIOutDTO<SupportingUserAPIOutDTO>;
    // Filter and process by type to have the items ordered also by the type (Parent1, Parent2, Partner1).
    Object.keys(SupportingUserType).forEach((supportingUserType) => {
      supportingUsers
        .filter(
          (supportingUser) =>
            supportingUser.supportingUserType === supportingUserType,
        )
        .forEach((supportingUser, index) => {
          const [craIncome] = incomeVerifications?.filter(
            (verification) =>
              verification.supportingUserId === supportingUser.id,
          );
          flattenedSupportingUsers[`${supportingUserType}${index + 1}`] = {
            id: supportingUser.id,
            supportingUserType: supportingUser.supportingUserType,
            supportingData: supportingUser.supportingData,
            craReportedIncome: craIncome?.craReportedIncome,
          };
        });
    });
    return flattenedSupportingUsers;
  }

  /**
   * Converts an array with student appeal requests to an object where every
   * appeal request will be a property named by the form.io definition name used
   * to execute the student appeal request submission.
   * @param appealRequests approved student appeal requests.
   * @returns object where every student appeal request is a property.
   */
  flattenStudentAppeals(
    appealRequests: StudentAppealRequest[],
  ): DynamicAPIOutDTO<StudentAppealRequestAPIOutDTO> {
    if (!appealRequests?.length) {
      return null;
    }
    // Object to be returned.
    const flattenedAppealRequests =
      {} as DynamicAPIOutDTO<StudentAppealRequestAPIOutDTO>;
    appealRequests.forEach((appealRequest) => {
      flattenedAppealRequests[appealRequest.submittedFormName] = {
        submittedData: appealRequest.submittedData,
      };
    });
    return flattenedAppealRequests;
  }

  /**
   * Get the notice of assessment data from the assessment.
   * @param assessmentId assessment id to be retrieved.
   * @param studentId optional student for authorization when needed.
   * @returns notice of assessment data.
   */
  async getAssessmentNOA(
    assessmentId: number,
    studentId?: number,
  ): Promise<AssessmentNOAAPIOutDTO> {
    const assessment = await this.assessmentService.getAssessmentForNOA(
      assessmentId,
      studentId,
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
      applicationNumber: assessment.application.applicationNumber,
      fullName: getUserFullName(assessment.application.student.user),
      programName: assessment.offering.educationProgram.name,
      locationName: assessment.offering.institutionLocation.name,
      offeringIntensity: assessment.offering.offeringIntensity,
      offeringStudyStartDate: getDateOnlyFormat(
        assessment.offering.studyStartDate,
      ),
      offeringStudyEndDate: getDateOnlyFormat(assessment.offering.studyEndDate),
      msfaaNumber: assessment.application.msfaaNumber.msfaaNumber,
      disbursement: this.populateDisbursementAwardValues(
        assessment.disbursementSchedules,
      ),
    };
  }

  /**
   * Disbursement data is populated with dynamic key in a defined pattern to be compatible with form table.
   * @param disbursementSchedules disbursement schedule details.
   * @param includeDocumentNumber when true document number is mapped
   * to disbursement dynamic data.
   * @returns disbursement dynamic award data.
   */
  private populateDisbursementAwardValues(
    disbursementSchedules: DisbursementSchedule[],
    includeDocumentNumber = true,
  ): Record<string, string | number> {
    const disbursementDetails = {};
    disbursementSchedules.forEach((schedule, index) => {
      const disbursementIdentifier = `disbursement${index + 1}`;
      disbursementDetails[`${disbursementIdentifier}Date`] = getDateOnlyFormat(
        schedule.disbursementDate,
      );
      disbursementDetails[`${disbursementIdentifier}Status`] =
        schedule.coeStatus;
      disbursementDetails[`${disbursementIdentifier}TuitionRemittance`] =
        schedule.tuitionRemittanceRequestedAmount;

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
   * @param studentId studentId student to whom the award details belong to.
   * @returns estimated and actual award details.
   */
  async getAssessmentAwardDetails(
    assessmentId: number,
    studentId?: number,
    includeDocumentNumber = true,
  ): Promise<AwardDetailsAPIOutDTO> {
    const assessment = await this.assessmentService.getAssessmentForNOA(
      assessmentId,
      studentId,
    );

    if (!assessment) {
      throw new NotFoundException("Assessment not found.");
    }
    const estimatedAward = this.populateDisbursementAwardValues(
      assessment.disbursementSchedules,
      includeDocumentNumber,
    );
    const [firstDisbursement, secondDisbursement] =
      assessment.disbursementSchedules;
    let finalAward = {};
    // Populate the final awards in a dynamic way like disbursement schedule(estimated) awards.
    if (firstDisbursement.coeStatus === COEStatus.completed) {
      const disbursementReceipts =
        await this.disbursementReceiptService.getDisbursementReceiptByAssessment(
          assessmentId,
          studentId,
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
   * Get all requests related to an assessments for a student
   * application, i.e, this will fetch all pending and denied
   * student appeals for an application or possible application
   * exceptions that will prevent the assessment to proceed till
   * they are approved, for instance, when a document is uploaded
   * and need to be reviewed.
   * @param applicationId application number.
   * @param studentId applicant student.
   * @param  includeOnlyAppeals then only student appeals are returned and
   * other assessment types must not be available when this property is true.
   * @returns assessment requests or exceptions for a student application.
   */

  async getRequestedAssessmentSummary(
    applicationId: number,
    studentId?: number,
    includeOnlyAppeals = false,
  ): Promise<RequestAssessmentSummaryAPIOutDTO[]> {
    const requestAssessmentSummary: RequestAssessmentSummaryAPIOutDTO[] = [];
    // Requested offering changes and application exceptions must not be included when includeOnlyAppeals is true.
    if (!includeOnlyAppeals) {
      const offeringChange =
        await this.educationProgramOfferingService.getOfferingRequestsByApplicationId(
          applicationId,
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

      const applicationExceptions =
        await this.applicationExceptionService.getExceptionsByApplicationId(
          applicationId,
          ApplicationExceptionStatus.Pending,
          ApplicationExceptionStatus.Declined,
        );

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
    }

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
    return requestAssessmentSummary.concat(studentAppealArray);
  }

  /**
   * Method to get history of assessments for an application,
   * i.e, this will have original assessment for the
   * student application, and all approved student
   * appeal and scholastic standings for the application
   * which will have different assessment status.
   * @param applicationId, application number.
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
}
