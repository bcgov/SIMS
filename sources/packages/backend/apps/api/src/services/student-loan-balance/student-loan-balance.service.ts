import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { StudentLoanBalance } from "@sims/sims-db";
import { Repository } from "typeorm";
import { MAXIMUM_ESSENTIAL_LOAN_BALANCE_RECORDS } from "../../utilities";

@Injectable()
export class StudentLoanBalanceService {
  constructor(
    @InjectRepository(StudentLoanBalance)
    private readonly studentLoanBalanceRepo: Repository<StudentLoanBalance>,
  ) {}

  /**
   * Get loan balance details of
   * the given student upto essential recent records.
   * @param studentId student.
   * @returns student loan balance.
   */
  async getStudentLoanBalance(
    studentId: number,
  ): Promise<StudentLoanBalance[]> {
    return this.studentLoanBalanceRepo.find({
      select: { id: true, balanceDate: true, cslBalance: true },
      where: { student: { id: studentId } },
      order: { balanceDate: "DESC" },
      take: MAXIMUM_ESSENTIAL_LOAN_BALANCE_RECORDS,
    });
  }
}
