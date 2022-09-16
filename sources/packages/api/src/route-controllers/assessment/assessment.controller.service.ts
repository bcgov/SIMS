import {
  CRAIncomeVerification,
  StudentAppealRequest,
  SupportingUser,
  SupportingUserType,
  DisbursementSchedule,
  COEStatus,
  DisbursementReceipt,
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
} from "../../services";
import {
  AssessmentNOAAPIOutDTO,
  AwardDetailsAPIOutDTO,
  DynamicAwardDTO,
} from "./models/assessment.dto";
import { getDateOnlyFormat, getUserFullName } from "../../utilities";

@Injectable()
export class AssessmentControllerService {
  constructor(
    private readonly assessmentService: StudentAssessmentService,
    private readonly disbursementReceiptService: DisbursementReceiptService,
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
   * @returns disbursement dynamic award data.
   */
  private populateDisbursementAwardValues(
    disbursementSchedules: DisbursementSchedule[],
  ): DynamicAwardDTO {
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
      schedule.coeStatus;
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
   * @param studentId student to whom the award details belong to.
   * @returns estimated and actual award details.
   */
  async getAwardDetails(
    assessmentId: number,
    studentId?: number,
  ): Promise<AwardDetailsAPIOutDTO> {
    const assessment = await this.assessmentService.getAssessmentForNOA(
      assessmentId,
      studentId,
    );

    if (!assessment) {
      throw new NotFoundException("Assessment was not found.");
    }
    const estimatedAward = this.populateDisbursementAwardValues(
      assessment.disbursementSchedules,
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

  private populateDisbursementReceiptAwardValues(
    disbursementReceipts: DisbursementReceipt[],
    disbursementScheduleId: number,
    identifier: string,
  ): DynamicAwardDTO {
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
}
