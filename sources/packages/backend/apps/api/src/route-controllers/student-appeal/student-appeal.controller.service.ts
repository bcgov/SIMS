import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  DetailedStudentAppealRequestAPIOutDTO,
  StudentAppealAPIOutDTO,
  StudentAppealRequestAPIOutDTO,
} from "./models/student-appeal.dto";
import { getUserFullName } from "../../utilities";
import {
  CHANGE_REQUEST_APPEAL_FORMS,
  StudentAppealService,
} from "../../services";
import { StudentAppealRequest, StudentAppealStatus } from "@sims/sims-db";

@Injectable()
export class StudentAppealControllerService {
  constructor(private readonly studentAppealService: StudentAppealService) {}

  /**
   * Get the student appeal and its requests.
   * @param appealId appeal id to be retrieved.
   * @param options options
   * - `studentId` student id.
   * - `applicationId`, application id.
   * - `assessDetails`, if true, will return access details.
   * @returns the student appeal and its requests.
   */
  async getStudentAppealWithRequests<
    T extends
      | DetailedStudentAppealRequestAPIOutDTO
      | StudentAppealRequestAPIOutDTO,
  >(
    appealId: number,
    options?: {
      studentId?: number;
      applicationId?: number;
      assessDetails?: boolean;
    },
  ): Promise<StudentAppealAPIOutDTO<T>> {
    const studentAppeal =
      await this.studentAppealService.getAppealAndRequestsById(appealId, {
        studentId: options?.studentId,
        applicationId: options?.applicationId,
      });
    if (!studentAppeal) {
      throw new NotFoundException("Not able to find the student appeal.");
    }

    return {
      id: studentAppeal.id,
      submittedDate: studentAppeal.submittedDate,
      status: studentAppeal.status,
      appealRequests: studentAppeal.appealRequests.map((appealRequest) => {
        let request = {
          id: appealRequest.id,
          appealStatus: appealRequest.appealStatus,
          submittedData: appealRequest.submittedData,
          submittedFormName: appealRequest.submittedFormName,
        } as T;

        if (options?.assessDetails) {
          request = {
            ...request,
            assessedDate: appealRequest.assessedDate,
            noteDescription: appealRequest.note?.description,
            assessedByUserName: getUserFullName(appealRequest.assessedBy),
          } as T;
        }
        return request;
      }),
    };
  }

  /**
   * Validates if the submitted appeal forms are eligible for the application.
   * @param formNames submitted form names.
   * @param eligibleApplicationAppeals eligible appeals for the application.
   * @throws UnprocessableEntityException if the form names are not valid for the submission operation.
   */
  validateAppealFormNames(
    formNames: string[],
    eligibleApplicationAppeals: string[],
  ): void {
    const ineligibleFormNames = formNames.filter(
      (formName) => !new Set(eligibleApplicationAppeals).has(formName),
    );
    if (ineligibleFormNames.length) {
      throw new UnprocessableEntityException(
        `The appeal form(s) ${ineligibleFormNames.join(", ")} is/are not eligible for the application.`,
      );
    }
  }

  /**
   * Validates the submitted legacy change request form names.
   * @param formNames submitted form names.
   * @throws UnprocessableEntityException if the form names are not valid for the change request submission.
   */
  validateLegacyChangeRequestFormNames(formNames: string[]): void {
    // Validate for change request submission.
    const hasNonChangeRequestForm = formNames.some(
      (formName) =>
        !CHANGE_REQUEST_APPEAL_FORMS.includes(formName.toLowerCase()),
    );
    if (hasNonChangeRequestForm) {
      throw new UnprocessableEntityException(
        "One or more forms submitted are not valid for change request submission.",
      );
    }
  }

  /**
   * Derive the appeal status based on the appeal requests of an appeal.
   * @param appealRequests appeal requests.
   * @returns appeal status.
   */
  getAppealStatus(appealRequests: StudentAppealRequest[]): StudentAppealStatus {
    if (!appealRequests.length) {
      throw new Error("An appeal must have at least one appeal request.");
    }
    if (
      appealRequests.some(
        (appealRequest) =>
          appealRequest.appealStatus === StudentAppealStatus.Pending,
      )
    ) {
      return StudentAppealStatus.Pending;
    }
    const appealStatus = appealRequests.some(
      (appealRequest) =>
        appealRequest.appealStatus === StudentAppealStatus.Approved,
    )
      ? StudentAppealStatus.Approved
      : StudentAppealStatus.Declined;
    return appealStatus;
  }
}
