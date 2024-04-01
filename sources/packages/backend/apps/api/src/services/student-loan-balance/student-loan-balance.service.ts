import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { StudentLoanBalances } from "@sims/sims-db";
import { Repository } from "typeorm";

@Injectable()
export class StudentLoanBalanceService {
  constructor(
    @InjectRepository(StudentLoanBalances)
    private readonly studentLoanBalanceRepo: Repository<StudentLoanBalances>,
  ) {}

  /**
   * Get loan balance details of
   * the given student upto 12 recent records.
   * @param studentId student.
   * @returns student loan balance.
   */
  async getStudentLoanBalance(
    studentId: number,
  ): Promise<StudentLoanBalances[]> {
    return this.studentLoanBalanceRepo.find({
      select: { id: true, balanceDate: true, cslBalance: true },
      where: { student: { id: studentId } },
      order: { balanceDate: "DESC" },
      take: 12,
    });
  }
}
