import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Injectable,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from "@nestjs/common";
import {
  ApiNotAcceptableResponse,
  ApiNotFoundResponse,
  ApiTags,
} from "@nestjs/swagger";
import { ClientTypeBaseRoute } from "../../types";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups, UserToken } from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import BaseController from "../BaseController";
import {
  FormNames,
  FormService,
  StudentAccountApplicationsService,
} from "../../services";
import {
  StudentAccountApplicationAPIOutDTO,
  StudentAccountApplicationApprovalAPIInDTO,
  StudentAccountApplicationSummaryAPIOutDTO,
} from "./models/student-account-application.dto";
import {
  CustomNamedError,
  getISODateOnlyString,
  getUserFullName,
} from "../../utilities";
import { IUserToken } from "../../auth/userToken.interface";
import { STUDENT_ACCOUNT_APPLICATION_NOT_FOUND } from "../../constants";

/**
 * Student account applications when the authentication happens through BCeID
 * and the Ministry needs to confirm the student identity.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("student-account-application")
@ApiTags(`${ClientTypeBaseRoute.AEST}-student-account-application`)
@Injectable()
export class StudentAccountApplicationAESTController extends BaseController {
  constructor(
    private readonly formService: FormService,
    private readonly studentAccountApplicationsService: StudentAccountApplicationsService,
  ) {
    super();
  }

  /**
   * Get the summary list of all student account applications
   * waiting to be assessed by the Ministry.
   * @returns summary list of pending student account applications.
   */
  @Get("pending")
  async getPendingStudentAccountApplications(): Promise<
    StudentAccountApplicationSummaryAPIOutDTO[]
  > {
    const accountApplications =
      await this.studentAccountApplicationsService.getPendingStudentAccountApplications();

    return accountApplications.map((accountApplication) => ({
      id: accountApplication.id,
      fullName: getUserFullName(accountApplication.user),
      submittedDate: getISODateOnlyString(accountApplication.submittedDate),
    }));
  }

  /**
   * Get the student account application previously submitted
   * by the student for the basic BCeID student account creation.
   * @param id student account application id.
   * @returns student account application.
   */
  @ApiNotAcceptableResponse({
    description: "Student account application not found.",
  })
  @Get(":id")
  async getStudentAccountApplicationById(
    @Param("id") id: number,
  ): Promise<StudentAccountApplicationAPIOutDTO> {
    const accountApplication =
      await this.studentAccountApplicationsService.getStudentAccountApplicationsById(
        id,
      );
    if (!accountApplication) {
      throw new NotFoundException("Student account application not found.");
    }

    return {
      id: accountApplication.id,
      submittedData: accountApplication.submittedData,
    };
  }

  /**
   * Approve the student account application associating the user
   * with a student account. The Ministry can also adjust any student
   * data that will then be used to create the student account.
   * @returns new student id created as a result of the approval.
   */
  @ApiNotFoundResponse({
    description: "Student account application not found.",
  })
  @Post(":studentAccountApplicationId/approve")
  async approveStudentAccountApplication(
    @Param("studentAccountApplicationId", ParseIntPipe)
    studentAccountApplicationId: number,
    @Body() payload: StudentAccountApplicationApprovalAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    const submissionResult = await this.formService.dryRunSubmission(
      FormNames.StudentProfile,
      payload,
    );

    if (!submissionResult.valid) {
      throw new BadRequestException(
        "Not able to approved the student account application due to an invalid request.",
      );
    }

    try {
      await this.studentAccountApplicationsService.approveStudentAccountApplication(
        studentAccountApplicationId,
        submissionResult.data.data,
        userToken.userId,
      );
    } catch (error: unknown) {
      if (
        error instanceof CustomNamedError &&
        error.name === STUDENT_ACCOUNT_APPLICATION_NOT_FOUND
      ) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  /**
   * Declines the student account application.
   */
  @Patch(":studentAccountApplicationId/decline")
  async declineStudentAccountApplication(
    @Param("studentAccountApplicationId", ParseIntPipe)
    studentAccountApplicationId: number,
  ): Promise<void> {
    try {
      await this.studentAccountApplicationsService.declineStudentAccountApplication(
        studentAccountApplicationId,
      );
    } catch (error: unknown) {
      if (
        error instanceof CustomNamedError &&
        error.name === STUDENT_ACCOUNT_APPLICATION_NOT_FOUND
      ) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}
