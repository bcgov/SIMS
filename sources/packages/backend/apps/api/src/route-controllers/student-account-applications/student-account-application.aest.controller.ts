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
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  Groups,
  Roles,
  UserToken,
} from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import BaseController from "../BaseController";
import {
  FormNames,
  FormService,
  StudentAccountApplicationApprovalModel,
  StudentAccountApplicationsService,
} from "../../services";
import {
  AESTStudentAccountApplicationAPIOutDTO,
  StudentAccountApplicationApprovalAPIInDTO,
  StudentAccountApplicationSummaryAPIOutDTO,
} from "./models/student-account-application.dto";
import { CustomNamedError } from "@sims/utilities";
import { IUserToken } from "../../auth/userToken.interface";
import {
  STUDENT_ACCOUNT_APPLICATION_NOT_FOUND,
  STUDENT_ACCOUNT_CREATION_FOUND_SIN_WITH_MISMATCH_DATA,
  STUDENT_ACCOUNT_CREATION_MULTIPLES_SIN_FOUND,
} from "../../constants";
import { Role } from "../../auth/roles.enum";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";

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
      lastName: accountApplication.user.lastName,
      givenNames: accountApplication.user.firstName,
      dateOfBirth: accountApplication.submittedData["dateOfBirth"],
      submittedDate: accountApplication.submittedDate,
    }));
  }

  /**
   * Get the student account application previously submitted
   * by the student for the basic BCeID student account creation.
   * @param studentAccountApplicationId student account application id.
   * @returns student account application.
   */
  @ApiNotFoundResponse({
    description: "Student account application not found.",
  })
  @Get(":studentAccountApplicationId")
  async getStudentAccountApplicationById(
    @Param("studentAccountApplicationId", ParseIntPipe)
    studentAccountApplicationId: number,
  ): Promise<AESTStudentAccountApplicationAPIOutDTO> {
    const accountApplication =
      await this.studentAccountApplicationsService.getStudentAccountApplicationsById(
        studentAccountApplicationId,
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
   * @param studentAccountApplicationId student account application id.
   * @param payload data to approve the student account application.
   * @returns new student id created as a result of the approval.
   */
  @ApiNotFoundResponse({
    description: "Student account application not found.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "Error while trying to associate the student to an existing student account. The same SIN was found but there is a data mismatch.",
  })
  @ApiBadRequestResponse({
    description:
      "Not able to approved the student account application due to an invalid request.",
  })
  @Roles(Role.StudentApproveDeclineAccountRequests)
  @Post(":studentAccountApplicationId/approve")
  async approveStudentAccountApplication(
    @Param("studentAccountApplicationId", ParseIntPipe)
    studentAccountApplicationId: number,
    @Body() payload: StudentAccountApplicationApprovalAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    const submissionResult =
      await this.formService.dryRunSubmission<StudentAccountApplicationApprovalModel>(
        FormNames.StudentProfile,
        payload,
      );

    if (!submissionResult.valid) {
      throw new BadRequestException(
        "Not able to approved the student account application due to an invalid request.",
      );
    }

    try {
      const createdStudent =
        await this.studentAccountApplicationsService.approveStudentAccountApplication(
          studentAccountApplicationId,
          submissionResult.data.data,
          userToken.userId,
        );
      return { id: createdStudent.id };
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case STUDENT_ACCOUNT_APPLICATION_NOT_FOUND:
            throw new NotFoundException(error.message);
          case STUDENT_ACCOUNT_CREATION_MULTIPLES_SIN_FOUND:
          case STUDENT_ACCOUNT_CREATION_FOUND_SIN_WITH_MISMATCH_DATA:
            // Ministry can have access to the specific SIN errors, so
            // send the complete error and description.
            throw new UnprocessableEntityException(
              new ApiProcessError(error.message, error.name),
            );
        }
      }
      throw error;
    }
  }

  /**
   * Declines the student account application.
   * @param studentAccountApplicationId student account application id.
   */
  @ApiNotFoundResponse({
    description: "Student account application not found.",
  })
  @Roles(Role.StudentApproveDeclineAccountRequests)
  @Patch(":studentAccountApplicationId/decline")
  async declineStudentAccountApplication(
    @Param("studentAccountApplicationId", ParseIntPipe)
    studentAccountApplicationId: number,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    try {
      await this.studentAccountApplicationsService.declineStudentAccountApplication(
        studentAccountApplicationId,
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
}
