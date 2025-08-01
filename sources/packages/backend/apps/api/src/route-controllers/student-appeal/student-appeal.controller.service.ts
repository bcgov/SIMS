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
import { StudentAppealService } from "../../services";

/**
 * Student appeal form that were used for change request process before 2025-26 program year.
 */
const CHANGE_REQUEST_APPEAL_FORMS = [
  "studentdependantsappeal",
  "studentadditionaltransportationappeal",
  "studentdisabilityappeal",
  "studentfinancialinformationappeal",
  "partnerinformationandincomeappeal",
];

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
   * Validates the submitted form names for the submission operation.
   * @param operation operation(change request | appeal).
   * @param formNames submitted form names.
   * @throws UnprocessableEntityException if the form names are not valid for the submission operation.
   */
  validateSubmittedFormNames(
    operation: "appeal" | "change request",
    formNames: string[],
  ): void {
    if (operation === "appeal") {
      const hasChangeRequestForm = formNames.some((formName) =>
        CHANGE_REQUEST_APPEAL_FORMS.includes(formName.toLowerCase()),
      );

      if (hasChangeRequestForm) {
        throw new UnprocessableEntityException(
          "One or more forms submitted are not valid for appeal submission.",
        );
      }
      return;
    }
    // Validate for change request submission.
    const hasAppealForm = formNames.some(
      (formName) =>
        !CHANGE_REQUEST_APPEAL_FORMS.includes(formName.toLowerCase()),
    );
    if (hasAppealForm) {
      throw new UnprocessableEntityException(
        "One or more forms submitted are not valid for change request submission.",
      );
    }
  }
}
