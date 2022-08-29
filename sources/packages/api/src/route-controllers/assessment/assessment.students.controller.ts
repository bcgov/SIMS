import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  UnprocessableEntityException,
} from "@nestjs/common";
import BaseController from "../BaseController";
import {
  AllowAuthorizedParty,
  RequiresStudentAccount,
  UserToken,
} from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ClientTypeBaseRoute } from "../../types";
import { AssessmentNOAAPIOutDTO } from "./models/assessment.dto";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { AssessmentControllerService } from "./assessment.controller.service";
import {
  ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
  ASSESSMENT_NOT_FOUND,
  StudentAssessmentService,
} from "../../services";
import { StudentUserToken } from "../../auth/userToken.interface";

@AllowAuthorizedParty(AuthorizedParties.student)
@RequiresStudentAccount()
@Controller("assessment")
@ApiTags(`${ClientTypeBaseRoute.Student}-assessment`)
export class AssessmentStudentsController extends BaseController {
  constructor(
    private readonly studentAssessmentService: StudentAssessmentService,
    private readonly assessmentControllerService: AssessmentControllerService,
  ) {
    super();
  }

  /**
   * Get the NOA values for a student application on a particular assessment.
   * @param assessmentId assessment id to get the NOA values.
   * @returns NOA and application data.
   */
  @Get(":assessmentId/noa")
  @ApiNotFoundResponse({
    description: "Assessment id not found for the student.",
  })
  @ApiUnprocessableEntityResponse({
    description: "Notice of assessment data is not present.",
  })
  async getAssessmentNOA(
    @Param("assessmentId") assessmentId: number,
    @UserToken() userToken: StudentUserToken,
  ): Promise<AssessmentNOAAPIOutDTO> {
    return this.assessmentControllerService.getAssessmentNOA(
      assessmentId,
      userToken.studentId,
    );
  }

  /**
   * Confirm assessment of a Student.
   * @param assessmentId assessment id to be confirmed.
   */
  @ApiNotFoundResponse({
    description: "Not able to find the assessment for the student.",
  })
  @ApiUnprocessableEntityResponse({
    description: "Student not found or assessment confirmation failed.",
  })
  @Patch(":assessmentId/confirm-assessment")
  async confirmAssessmentNOA(
    @Param("assessmentId") assessmentId: number,
    @UserToken() userToken: StudentUserToken,
  ): Promise<void> {
    try {
      await this.studentAssessmentService.studentConfirmAssessment(
        assessmentId,
        userToken.studentId,
        userToken.userId,
      );
    } catch (error) {
      switch (error.name) {
        case ASSESSMENT_NOT_FOUND:
          throw new NotFoundException(error.message);
        case ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE:
          throw new UnprocessableEntityException(error.message);
        default:
          throw error;
      }
    }
  }
}
