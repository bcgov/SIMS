import {
  Controller,
  Param,
  Get,
  NotFoundException,
  Patch,
  Body,
  UnprocessableEntityException,
} from "@nestjs/common";
import { StudentAppealService, WorkflowActionsService } from "../../services";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups, UserToken } from "../../auth/decorators";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute } from "../../types";
import { UserGroups } from "../../auth/user-groups.enum";
import {
  StudentAppealApiOutDTO,
  StudentAppealApprovalApiInDTO,
} from "./models/student-appeal.dto";
import { getUserFullName } from "../../utilities";
import { IUserToken } from "../../auth/userToken.interface";
import {
  STUDENT_APPEAL_INVALID_OPERATION,
  STUDENT_APPEAL_NOT_FOUND,
} from "../../services/student-appeal/constants";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("appeal")
@ApiTags(`${ClientTypeBaseRoute.AEST}-appeal`)
export class StudentAppealAESTController extends BaseController {
  constructor(
    private readonly studentAppealService: StudentAppealService,
    private readonly workflowActionsService: WorkflowActionsService,
  ) {
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

  @Patch(":appealId/requests")
  async approveStudentAppealRequests(
    @Param("appealId") appealId: number,
    @Body() payload: StudentAppealApprovalApiInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    try {
      const savedAppeal = await this.studentAppealService.approveRequests(
        appealId,
        payload.requests,
        userToken.userId,
      );

      if (savedAppeal.studentAssessment) {
        await this.workflowActionsService.startApplicationAssessment(
          savedAppeal.application.data.workflowName,
          savedAppeal.application.id,
          savedAppeal.studentAssessment.id,
        );
      }
    } catch (error) {
      switch (error.name) {
        case STUDENT_APPEAL_NOT_FOUND:
          throw new NotFoundException(error.message);
        case STUDENT_APPEAL_INVALID_OPERATION:
          throw new UnprocessableEntityException(error.message);
        default:
          throw error;
      }
    }
  }
}
