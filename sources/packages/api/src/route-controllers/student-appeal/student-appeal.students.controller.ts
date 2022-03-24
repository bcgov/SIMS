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
  StudentAppealService,
  ApplicationService,
  FormService,
} from "../../services";
import { StudentAppealDTO } from "./models/student-appeal.dto";
import { PrimaryIdentifierDTO } from "../models/primary.identifier.dto";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, UserToken } from "../../auth/decorators";
import { IUserToken } from "../../auth/userToken.interface";
import {
  ApiTags,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
} from "@nestjs/swagger";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute, ApiProcessError } from "../../types";
import { INVALID_APPLICATION_NUMBER, INVALID_FORM_DATA } from "../../constants";
import { CustomNamedError } from "../../utilities";

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
  @ApiCreatedResponse({ description: "Student appeal created successfully." })
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
    @Body() payload: StudentAppealDTO,
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
    try {
      const dryRunPromise = payload.studentAppealRequests.map((studentAppeal) =>
        this.formService.dryRunSubmission(
          studentAppeal.formName,
          studentAppeal.formData,
        ),
      );
      const submissionResults = await Promise.all(dryRunPromise);
      submissionResults.forEach((result) => {
        if (!result.valid) {
          throw new CustomNamedError(
            "Not able to submit student appeal due to invalid request.",
            INVALID_FORM_DATA,
          );
        }
      });
    } catch (error) {
      if (error.name === INVALID_FORM_DATA) {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException(
        "Dry run submission failed due to unknown reason.",
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
