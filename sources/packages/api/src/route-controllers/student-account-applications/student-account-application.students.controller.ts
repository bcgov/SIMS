import {
  BadRequestException,
  Body,
  Controller,
  Injectable,
  Post,
} from "@nestjs/common";
import { ApiBadRequestResponse, ApiTags } from "@nestjs/swagger";
import { IUserToken } from "../../auth/userToken.interface";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  RequiresStudentAccount,
  UserToken,
} from "../../auth/decorators";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute } from "../../types";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { CreateStudentAccountApplicationAPIInDTO } from "./models/student-account-application.dto";
import {
  StudentAccountApplicationsService,
  StudentAccountApplicationCreateModel,
  FormService,
  FormNames,
} from "../../services";
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
  @Post()
  @RequiresStudentAccount(false)
  async create(
    @UserToken() userToken: IUserToken,
    @Body() payload: CreateStudentAccountApplicationAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    const submissionResult = await this.formService.dryRunSubmission(
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
        submissionResult.data.data as StudentAccountApplicationCreateModel,
      );

    return { id: newAccountApplication.id };
  }
}
