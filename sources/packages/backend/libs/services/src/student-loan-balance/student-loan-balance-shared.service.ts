import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { StudentLoanBalance } from "@sims/sims-db";
import { Repository } from "typeorm";

@Injectable()
export class StudentLoanBalanceSharedService {
  constructor(
    @InjectRepository(StudentLoanBalance)
    private readonly studentLoanBalanceRepo: Repository<StudentLoanBalance>,
  ) {}

  /**
   * Get the latest CSLP balance for the student.
   * @param studentId Student id.
   * @returns latest CSLP balance or 0 if there are no records.
   */
  async getLatestCSLPBalance(studentId: number): Promise<number> {
    const getStudentLatestLoanBalance = await this.studentLoanBalanceRepo
      .createQueryBuilder("studentLoanBalance")
      .select("studentLoanBalance.cslBalance")
      .where("studentLoanBalance.student.id = :studentId", { studentId })
      .limit(1)
      .orderBy("studentLoanBalance.balanceDate", "DESC")
      .getOne();
    return getStudentLatestLoanBalance?.cslBalance ?? 0;
  }
}
