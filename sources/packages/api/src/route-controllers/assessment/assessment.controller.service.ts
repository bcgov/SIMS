import {
  CRAIncomeVerification,
  StudentAppealRequest,
  SupportingUser,
  SupportingUserType,
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
import { StudentAssessmentService } from "../../services";
import { AssessmentNOAAPIOutDTO } from "./models/assessment.dto";
import { dateString, getUserFullName } from "../../utilities";

@Injectable()
export class AssessmentControllerService {
  constructor(private readonly assessmentService: StudentAssessmentService) {}

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

    //Disbursement data is populated with dynamic key in a defined pattern to be compatible with form table.
    const disbursementDetails = {};
    assessment.disbursementSchedules.forEach((schedule, index) => {
      const disbursementIdentifier = `disbursement${index + 1}`;
      disbursementDetails[`${disbursementIdentifier}Date`] = dateString(
        schedule.disbursementDate,
      );
      schedule.disbursementValues.forEach((disbursement) => {
        const disbursementValueKey = `${disbursementIdentifier}${disbursement.valueCode.toLowerCase()}`;
        disbursementDetails[disbursementValueKey] = disbursement.valueAmount;
      });
    });

    return {
      assessment: assessment.assessmentData,
      applicationNumber: assessment.application.applicationNumber,
      fullName: getUserFullName(assessment.application.student.user),
      programName: assessment.offering.educationProgram.name,
      locationName: assessment.offering.institutionLocation.name,
      offeringIntensity: assessment.offering.offeringIntensity,
      offeringStudyStartDate: dateString(assessment.offering.studyStartDate),
      offeringStudyEndDate: dateString(assessment.offering.studyEndDate),
      msfaaNumber: assessment.application.msfaaNumber.msfaaNumber,
      disbursement: disbursementDetails,
    };
  }
}
