import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
} from "@nestjs/common";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import { StudentService } from "../../services";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import { StudentLoanBalanceAPIOutDTO } from "./models/student-loan-balance.dto";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("student-loan-balance")
@ApiTags(`${ClientTypeBaseRoute.AEST}-student-loan-balance`)
export class StudentLoanBalanceAESTController extends BaseController {
  constructor(private readonly studentService: StudentService) {
    super();
  }

  /**
   * Get loan balance details of
   * the given student upto 12 recent records received.
   * @param studentId student.
   * @returns student loan balance.
   */
  @ApiNotFoundResponse({
    description: "Student not found.",
  })
  @Get("student/:studentId")
  async getStudentLoanBalance(
    @Param("studentId", ParseIntPipe) studentId: number,
  ): Promise<StudentLoanBalanceAPIOutDTO> {
    const studentExist = await this.studentService.studentExists(studentId);
    if (!studentExist) {
      throw new NotFoundException("Student not found.");
    }
    //TODO: Remove the static values when actual implementation is done.
    const staticData: StudentLoanBalanceAPIOutDTO = {
      loanBalanceDetails: [
        { balanceDate: "2024-03-10", cslBalance: 100 },
        { balanceDate: "2024-02-10", cslBalance: 200 },
        { balanceDate: "2024-01-10", cslBalance: 300 },
      ],
    };
    return staticData;
  }
}
