import {
  Controller,
  Get,
  Injectable,
  NotFoundException,
  Param,
} from "@nestjs/common";
import { ApiNotAcceptableResponse, ApiTags } from "@nestjs/swagger";
import { ClientTypeBaseRoute } from "../../types";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import BaseController from "../BaseController";
import { StudentAccountApplicationsService } from "../../services";
import {
  StudentAccountApplicationAPIOutDTO,
  StudentAccountApplicationSummaryAPIOutDTO,
} from "./models/student-account-application.dto";
import { getISODateOnlyString, getUserFullName } from "../../utilities";

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
}
