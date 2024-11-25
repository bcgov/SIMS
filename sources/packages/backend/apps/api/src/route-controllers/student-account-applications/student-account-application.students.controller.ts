import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Injectable,
  Post,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { IUserToken, StudentUserToken } from "../../auth/userToken.interface";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  RequiresStudentAccount,
  RequiresUserAccount,
  UserToken,
} from "../../auth/decorators";
import BaseController from "../BaseController";
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import {
  CreateStudentAccountApplicationAPIInDTO,
  StudentAccountApplicationAPIOutDTO,
} from "./models/student-account-application.dto";
import {
  StudentAccountApplicationsService,
  StudentAccountApplicationCreateModel,
  FormService,
  FormNames,
} from "../../services";
import { STUDENT_ACCOUNT_APPLICATION_USER_ALREADY_EXISTS } from "../../constants";

/**
 * Student account applications when the authentication happens through BCeID
 * and the Ministry needs to confirm the student identity.
 */
@AllowAuthorizedParty(AuthorizedParties.student)
@RequiresStudentAccount()
@Controller("student-account-application")
@ApiTags(`${ClientTypeBaseRoute.Student}-student-account-application`)
@Injectable()
export class StudentAccountApplicationStudentsController extends BaseController {
  constructor(
    private readonly formService: FormService,
    private readonly studentAccountApplicationsService: StudentAccountApplicationsService,
  ) {
    super();
  }

  /**
   * Create a new student account application to be reviewed by
   * the Ministry to confirm the student's basic BCeID identity.
   * @param payload information to be assessed by the Ministry.
   * @returns student account application created id.
   */
  @ApiBadRequestResponse({
    description:
      "Not able to create a student account application due to an invalid request.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "There is already a student account application in progress or the user is already present.",
  })
  @Post()
  @RequiresUserAccount(false)
  @RequiresStudentAccount(false)
  async create(
    @UserToken() userToken: IUserToken,
    @Body() payload: CreateStudentAccountApplicationAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    const hasPendingStudentAccountApplication =
      await this.studentAccountApplicationsService.hasPendingStudentAccountApplication(
        userToken.userName,
      );
    if (hasPendingStudentAccountApplication) {
      throw new UnprocessableEntityException(
        new ApiProcessError(
          "There is already a student account application in progress.",
          STUDENT_ACCOUNT_APPLICATION_USER_ALREADY_EXISTS,
        ),
      );
    }

    const submissionResult =
      await this.formService.dryRunSubmission<StudentAccountApplicationCreateModel>(
        FormNames.StudentProfile,
        payload.submittedData,
      );

    if (!submissionResult.valid) {
      throw new BadRequestException(
        "Not able to create a student account application due to an invalid request.",
      );
    }

    const newAccountApplication =
      await this.studentAccountApplicationsService.createStudentAccountApplication(
        userToken.userName,
        submissionResult.data.data,
      );

    return { id: newAccountApplication.id };
  }

  /**
   * Checks if a user has a pending student account application.
   * @returns true if there is a pending student account application
   * to be assessed by the Ministry, otherwise, false.
   */
  @RequiresUserAccount(false)
  @RequiresStudentAccount(false)
  @Get("has-pending-account-application")
  async hasPendingAccountApplication(
    @UserToken() studentUserToken: StudentUserToken,
  ): Promise<StudentAccountApplicationAPIOutDTO> {
    const hasPendingApplication =
      await this.studentAccountApplicationsService.hasPendingStudentAccountApplication(
        studentUserToken.userName,
      );
    return { hasPendingApplication };
  }
}
