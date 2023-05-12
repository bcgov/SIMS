import { Injectable, NotFoundException } from "@nestjs/common";
import {
  StudentAppealAPIOutDTO,
} from "./models/student-appeal.dto";
import { getUserFullName } from "../../utilities";
import { StudentAppealService } from "../../services";

@Injectable()
export class StudentAppealControllerService {
  constructor(private readonly studentAppealService: StudentAppealService) {}

  /**
   * Get the student appeal and its requests.
   * @param appealId appeal id to be retrieved.
   * @param options options
   * - `studentId` student id.
   * - `assessDetails`, if true, will return access details.
   * @returns the student appeal and its requests.
   */
  async getStudentAppealWithRequest<T>(
    appealId: number,
    options?: {
      studentId?: number,
      assessDetails?: boolean;
    },
  ): Promise<StudentAppealAPIOutDTO<T>> {
    const studentAppeal =
      await this.studentAppealService.getAppealAndRequestsById(
        appealId,
        options?.studentId,
      );
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
        return request as T;
      }),
    };
  }
}
