import {
  Controller,
  Param,
  Get,
  NotFoundException,
  Patch,
  Body,
  UnprocessableEntityException,
} from "@nestjs/common";
import { StudentAppealService, StudentAssessmentService } from "../../services";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups, UserToken } from "../../auth/decorators";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
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
import { StudentAppealStatus } from "../../database/entities";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("appeal")
@ApiTags(`${ClientTypeBaseRoute.AEST}-appeal`)
export class StudentAppealAESTController extends BaseController {
  constructor(
    private readonly studentAppealService: StudentAppealService,
    private readonly studentAssessmentService: StudentAssessmentService,
  ) {
    super();
  }

  /**
   * Get the student appeal and its requests.
   * @param appealId appeal id to be retrieved.
   * @returns the student appeal and its requests.
   */
  @Get(":appealId/requests")
  @ApiNotFoundResponse({
    description: "Not able to find the student appeal.",
  })
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

  /**
   * Update all student appeals requests at once.
   * All the appeals requests must be present with the respective
   * approved or declined status.
   * @param appealId appeal id to be approved/declined.
   * @param payload appeal requests to be approved/declined.
   * @param userToken user authentication token.
   */
  @Patch(":appealId/requests")
  @ApiNotFoundResponse({
    description: `Not able to find the appeal or the appeal has requests different from '${StudentAppealStatus.Pending}'.`,
  })
  @ApiUnprocessableEntityResponse({
    description:
      `It is not possible to process the appeal approval because one of the following conditions: ` +
      `the appeal is not in the '${StudentAppealStatus.Pending}' status; ` +
      `the appeal is already associated with an assessment workflow; ` +
      `some appeal request is already in a state different than '${StudentAppealStatus.Pending}'.`,
  })
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

      // The appeal approval will create a student assessment to be processed only
      // if at least one request was approved, hence sometimes an appeal will not result
      // is an assessment creation if all requests are declined.
      if (savedAppeal.studentAssessment) {
        await this.studentAssessmentService.startAssessment(
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
