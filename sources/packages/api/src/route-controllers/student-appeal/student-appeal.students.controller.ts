import {
  Controller,
  Param,
  Post,
  Body,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { StudentAppealService, ApplicationService } from "../../services";
import { StudentAppealRequestDTO } from "./models/student-appeal.dto";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, UserToken } from "../../auth/decorators";
import { IUserToken } from "../../auth/userToken.interface";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute, ApiProcessError } from "../../types";
import { INVALID_APPLICATION_NUMBER } from "../../constants";

@AllowAuthorizedParty(AuthorizedParties.student)
@Controller("appeal")
@ApiTags(`${ClientTypeBaseRoute.Student}-appeal`)
export class StudentAppealStudentsController extends BaseController {
  constructor(
    private readonly studentAppealService: StudentAppealService,
    private readonly applicationService: ApplicationService,
  ) {
    super();
  }

  /**
   * Submit student appeal.
   * @param applicationId application for which the appeal is submitted.
   * @param payload appeal requests.
   * @param userToken
   */
  @Post("application/:applicationId")
  async updateDesignationAgreement(
    @Param("applicationId") applicationId: number,
    @Body() payload: StudentAppealRequestDTO[],
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    const application = this.applicationService.getApplicationToRequestChange(
      undefined,
      userToken.userId,
      applicationId,
    );
    if (!application) {
      throw new NotFoundException(
        new ApiProcessError(
          "Given application either does not exist or is not complete to request change.",
          INVALID_APPLICATION_NUMBER,
        ),
      );
    }
    const existingStudentAppeal =
      await this.studentAppealService.hasExistingAppeal(userToken.userId);
    if (existingStudentAppeal) {
      throw new UnprocessableEntityException(
        "There is already a pending appeal for this student.",
      );
    }
    await this.studentAppealService.saveStudentAppeals(
      applicationId,
      userToken.userId,
      payload,
    );
  }
}
