import {
  Controller,
  Param,
  Post,
  Body,
  NotFoundException,
  UnprocessableEntityException,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import {
  ApplicationService,
  FormService,
  StudentAppealService,
} from "../../services";
import { StudentAppealApiInDTO } from "./models/student-appeal.dto";
import { PrimaryIdentifierDTO } from "../models/primary.identifier.dto";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, UserToken } from "../../auth/decorators";
import { IUserToken } from "../../auth/userToken.interface";
import {
  ApiTags,
  ApiNotFoundResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
} from "@nestjs/swagger";
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
    description: "There is an existing appeal for this student.",
  })
  @ApiBadRequestResponse({
    description: "Not able to submit student appeal due to invalid request.",
  })
  @Post("application/:applicationId")
  async submitStudentAppeal(
    @Param("applicationId") applicationId: number,
    @Body() payload: StudentAppealApiInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<PrimaryIdentifierDTO> {
    const application = this.applicationService.getApplicationToRequestAppeal(
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
    const existingStudentAppeal =
      await this.studentAppealService.hasExistingAppeal(userToken.userId);
    if (existingStudentAppeal) {
      throw new UnprocessableEntityException(
        "There is already a pending appeal for this student.",
      );
    }
    let dryRunSubmissionResults = [];
    try {
      const dryRunPromise = payload.studentAppealRequests.map((appeal) =>
        this.formService.dryRunSubmission(appeal.formName, appeal.formData),
      );
      dryRunSubmissionResults = await Promise.all(dryRunPromise);
    } catch (error) {
      //TODO: Add a logger to log the error trace.
      throw new InternalServerErrorException(
        "Dry run submission failed due to unknown reason.",
      );
    }
    const invalidRequest = dryRunSubmissionResults.some(
      (result) => !result.valid,
    );
    if (invalidRequest) {
      throw new BadRequestException(
        "Not able to submit student appeal due to invalid request.",
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
}
