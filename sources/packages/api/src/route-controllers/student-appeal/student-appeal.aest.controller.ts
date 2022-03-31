import { Controller, Param, Get, NotFoundException } from "@nestjs/common";
import { StudentAppealService } from "../../services";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute } from "../../types";
import { UserGroups } from "src/auth/user-groups.enum";
import { StudentAppealApiOutDTO } from "./models/student-appeal.dto";
import { getUserFullName } from "src/utilities";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("appeal")
@ApiTags(`${ClientTypeBaseRoute.AEST}-appeal`)
export class StudentAppealAESTController extends BaseController {
  constructor(private readonly studentAppealService: StudentAppealService) {
    super();
  }

  @Get(":appealId/requests")
  async getStudentAppealWithRequests(
    @Param("appealId") appealId: number,
  ): Promise<StudentAppealApiOutDTO> {
    const studentAppeal =
      await this.studentAppealService.getAppealAndRequestsById(appealId);
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
