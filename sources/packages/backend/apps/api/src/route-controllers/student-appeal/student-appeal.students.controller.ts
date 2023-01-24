import {
  Controller,
  Param,
  Post,
  Body,
  NotFoundException,
  UnprocessableEntityException,
  Get,
  ParseIntPipe,
} from "@nestjs/common";
import {
  ApplicationService,
  FormService,
  StudentAppealService,
} from "../../services";
import {
  StudentAppealAPIInDTO,
  StudentAppealAPIOutDTO,
} from "./models/student-appeal.dto";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  RequiresStudentAccount,
  UserToken,
} from "../../auth/decorators";
import { IUserToken, StudentUserToken } from "../../auth/userToken.interface";
import {
  ApiTags,
  ApiNotFoundResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
} from "@nestjs/swagger";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute, ApiProcessError } from "../../types";
import {
  APPLICATION_CHANGE_NOT_ELIGIBLE,
  INVALID_APPLICATION_NUMBER,
} from "../../constants";

@AllowAuthorizedParty(AuthorizedParties.student)
@RequiresStudentAccount()
@Controller("appeal")
@ApiTags(`${ClientTypeBaseRoute.Student}-appeal`)
export class StudentAppealStudentsController extends BaseController {
  constructor(
    private readonly studentAppealService: StudentAppealService,
    private readonly applicationService: ApplicationService,
    private readonly formService: FormService,
  ) {
    super();
  }

  /**
   * Submit student appeal.
   * @param applicationId application for which the appeal is submitted.
   * @param payload student appeal with appeal requests.
   * @param userToken
   */
  @ApiNotFoundResponse({
    description:
      "Application either not found or not eligible to request an appeal.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "There is either an existing appeal for this student or this application is no longer eligible to request changes.",
  })
  @ApiBadRequestResponse({
    description: "Not able to submit student appeal due to invalid request.",
  })
  @Post("application/:applicationId")
  async submitStudentAppeal(
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @Body() payload: StudentAppealAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    const application =
      await this.applicationService.getApplicationToRequestAppeal(
        userToken.userId,
        undefined,
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

    if (application.isArchived) {
      throw new UnprocessableEntityException(
        new ApiProcessError(
          "This application is no longer eligible to request changes.",
          APPLICATION_CHANGE_NOT_ELIGIBLE,
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

    const studentAppeal = await this.studentAppealService.saveStudentAppeals(
      applicationId,
      userToken.userId,
      payload.studentAppealRequests,
    );
    return {
      id: studentAppeal.id,
    };
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
    @Param("appealId", ParseIntPipe) appealId: number,
    @UserToken() userToken: StudentUserToken,
  ): Promise<StudentAppealAPIOutDTO> {
    const studentAppeal =
      await this.studentAppealService.getAppealAndRequestsById(
        appealId,
        userToken.studentId,
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
      })),
    };
  }
}
