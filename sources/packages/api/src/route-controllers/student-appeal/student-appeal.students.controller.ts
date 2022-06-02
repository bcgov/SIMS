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
  APPLICATION_CHANGE_NOT_ELIGIBLE,
  FormService,
  StudentAppealService,
} from "../../services";
import { StudentAppealAPIInDTO } from "./models/student-appeal.dto";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  RequiresStudentAccount,
  UserToken,
} from "../../auth/decorators";
import { IUserToken } from "../../auth/userToken.interface";
import {
  ApiTags,
  ApiNotFoundResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
} from "@nestjs/swagger";
import BaseController from "../BaseController";
import {
  ClientTypeBaseRoute,
  ApiProcessError,
  DryRunSubmissionResult,
} from "../../types";
import { INVALID_APPLICATION_NUMBER } from "../../constants";
import { StudentAppealRequestModel } from "../../services/student-appeal/student-appeal.model";

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
    @Param("applicationId") applicationId: number,
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
    let dryRunSubmissionResults: DryRunSubmissionResult[] = [];
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

    // Generate the data to be persisted based on the result of the dry run submission.
    const appealRequests = dryRunSubmissionResults.map(
      (result) =>
        ({
          formName: result.formName,
          formData: result.data.data,
        } as StudentAppealRequestModel),
    );

    const studentAppeal = await this.studentAppealService.saveStudentAppeals(
      applicationId,
      userToken.userId,
      appealRequests,
    );
    return {
      id: studentAppeal.id,
    };
  }
}
