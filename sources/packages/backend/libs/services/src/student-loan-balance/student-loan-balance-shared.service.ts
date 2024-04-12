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

  async getLatestCSLPBalance(studentId: number): Promise<StudentLoanBalance[]> {
    return this.studentLoanBalanceRepo.find({
      select: { cslBalance: true },
      where: { student: { id: studentId } },
      order: { balanceDate: "DESC" },
    });
  }
}
