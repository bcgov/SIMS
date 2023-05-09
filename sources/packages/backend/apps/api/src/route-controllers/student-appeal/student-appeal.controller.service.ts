import { NotFoundException } from "@nestjs/common";
import { StudentAppealService } from "../../services";
import BaseController from "../BaseController";
import { StudentAppealAPIOutDTO } from "./models/student-appeal.dto";
import { getUserFullName } from "../../utilities";

export class StudentAppealControllerService extends BaseController {
  constructor(private readonly studentAppealService: StudentAppealService) {
    super();
  }

  /**
   * Get the student appeal and its requests.
   * @param appealId appeal id to be retrieved.
   * @param studentId student id.
   * @returns the student appeal and its requests.
   */
  async getStudentAppealWithRequest(
    appealId: number,
    studentId?: number,
  ): Promise<StudentAppealAPIOutDTO> {
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
      appealRequests: studentAppeal.appealRequests.map((appealRequest) => ({
        id: appealRequest.id,
        appealStatus: appealRequest.appealStatus,
        submittedData: appealRequest.submittedData,
        submittedFormName: appealRequest.submittedFormName,
        assessedDate: appealRequest.assessedDate,
        noteDescription: appealRequest.note?.description,
        assessedByUserName: getUserFullName(appealRequest.assessedBy),
      })),
    };
  }
}
