import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "@sims/sims-db";
import { StudentLoanBalances } from "@sims/sims-db/entities/student-loan-balances.model";
import { DataSource } from "typeorm";

@Injectable()
export class StudentLoanBalancesService extends RecordDataModelService<StudentLoanBalances> {
  constructor(private readonly dataSource: DataSource) {
    super(dataSource.getRepository(StudentLoanBalances));
  }
}
