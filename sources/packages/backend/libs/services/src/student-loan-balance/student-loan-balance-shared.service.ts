import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { StudentAssessmentService } from "@sims/integrations/services";
import { StudentLoanBalance } from "@sims/sims-db";
import { Repository } from "typeorm";

@Injectable()
export class StudentLoanBalanceSharedService {
  constructor(
    @InjectRepository(StudentLoanBalance)
    private readonly studentLoanBalanceRepo: Repository<StudentLoanBalance>,
    private readonly studentAssessmentService: StudentAssessmentService,
  ) {}

  async getLatestCSLPBalance(
    assessmentId: number,
  ): Promise<StudentLoanBalance> {
    const studentAssessment = await this.studentAssessmentService.getStudentId(
      assessmentId,
    );
    if (studentAssessment.application.student.id) {
      return this.studentLoanBalanceRepo.findOne({
        select: { cslBalance: true },
        where: { student: { id: studentAssessment.application.student.id } },
        order: { balanceDate: "DESC" },
      });
    }
  }
}
