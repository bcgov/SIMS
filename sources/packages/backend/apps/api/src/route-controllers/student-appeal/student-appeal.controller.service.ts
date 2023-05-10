import { Injectable, NotFoundException } from "@nestjs/common";
import {
  StudentAppealAPIOutDTO,
  DetailedStudentAppealAPIOutDTO,
  StudentAppealRequestAPIOutDTO,
  DetailedStudentAppealRequestAPIOutDTO,
} from "./models/student-appeal.dto";
import { getUserFullName } from "../../utilities";
import { StudentAppealService } from "../../services";

@Injectable()
export class StudentAppealControllerService {
  constructor(private readonly studentAppealService: StudentAppealService) {}

  /**
   * Get the student appeal and its requests.
   * @param appealId appeal id to be retrieved.
   * @param studentId student id.
   * @returns the student appeal and its requests.
   */
  async getStudentAppealWithRequest(
    appealId: number,
    studentId?: number,
    options?: {
      assessDetails?: false;
    },
  ): Promise<StudentAppealAPIOutDTO | DetailedStudentAppealAPIOutDTO> {
    const studentAppeal =
      await this.studentAppealService.getAppealAndRequestsById(
        appealId,
        studentId,
      );
    if (!studentAppeal) {
      throw new NotFoundException("Not able to find the student appeal.");
    }

    return {
      id: studentAppeal.id,
      submittedDate: studentAppeal.submittedDate,
      status: studentAppeal.status,
      appealRequests: studentAppeal.appealRequests.map((appealRequest) => {
        const requests: DetailedStudentAppealRequestAPIOutDTO
           = {
          id: appealRequest.id,
          appealStatus: appealRequest.appealStatus,
          submittedData: appealRequest.submittedData,
          submittedFormName: appealRequest.submittedFormName,
        };
        if (options?.assessDetails) {
          requests.assessedDate = appealRequest.assessedDate;
          requests.noteDescription = appealRequest.note?.description;
          requests.assessedByUserName = getUserFullName(
            appealRequest.assessedBy,
          );
        }
        return requests;
      }),
    };
  }
}
