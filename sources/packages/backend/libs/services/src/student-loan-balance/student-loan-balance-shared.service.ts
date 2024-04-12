import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { StudentLoanBalance } from "@sims/sims-db";
import { Repository } from "typeorm";
import { StudentAssessmentSharedService } from "../students-assessments/student-assessment-shared.service";

@Injectable()
export class StudentLoanBalanceSharedService {
  constructor(
    @InjectRepository(StudentLoanBalance)
    private readonly studentLoanBalanceRepo: Repository<StudentLoanBalance>,
    private readonly studentAssessmentSharedService: StudentAssessmentSharedService,
  ) {}

  async getLatestCSLPBalance(
    assessmentId: number,
  ): Promise<StudentLoanBalance> {
    const studentAssessment =
      await this.studentAssessmentSharedService.getStudentId(assessmentId);
    if (studentAssessment.application.student.id) {
      return this.studentLoanBalanceRepo.findOne({
        select: { cslBalance: true },
        where: { student: { id: studentAssessment.application.student.id } },
        order: { balanceDate: "DESC" },
      });
    }
  }
}
