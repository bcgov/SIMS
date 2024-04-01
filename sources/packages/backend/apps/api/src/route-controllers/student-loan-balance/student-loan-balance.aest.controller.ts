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
import { StudentLoanBalanceService, StudentService } from "../../services";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import {
  StudentLoanBalanceAPIOutDTO,
  StudentLoanBalanceDetailAPIOutDTO,
} from "./models/student-loan-balance.dto";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("student-loan-balance")
@ApiTags(`${ClientTypeBaseRoute.AEST}-student-loan-balance`)
export class StudentLoanBalanceAESTController extends BaseController {
  constructor(
    private readonly studentService: StudentService,
    private readonly studentLoanBalanceService: StudentLoanBalanceService,
  ) {
    super();
  }

  /**
   * Get loan balance details of
   * the given student upto essential recent records received.
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
    const studentLoanBalances =
      await this.studentLoanBalanceService.getStudentLoanBalance(studentId);
    const loanBalanceDetails =
      studentLoanBalances.map<StudentLoanBalanceDetailAPIOutDTO>(
        (studentLoanBalance) => ({
          balanceDate: studentLoanBalance.balanceDate,
          cslBalance: studentLoanBalance.cslBalance,
        }),
      );
    return {
      loanBalanceDetails,
    };
  }
}
