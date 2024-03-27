import { Injectable } from "@nestjs/common";
import { DataModelService } from "@sims/sims-db";
import { StudentLoanBalances } from "@sims/sims-db/entities/student-loan-balances.model";
import { DataSource } from "typeorm";

@Injectable()
export class StudentLoanBalancesService extends DataModelService<StudentLoanBalances> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(StudentLoanBalances));
  }
}
