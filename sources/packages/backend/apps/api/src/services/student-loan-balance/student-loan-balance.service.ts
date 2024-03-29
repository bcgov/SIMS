import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Application, StudentLoanBalances } from "@sims/sims-db";
import { Repository } from "typeorm";

@Injectable()
export class ApplicationOfferingChangeRequestService {
  constructor(
    @InjectRepository(Application)
    private readonly studentLoanBalanceRepo: Repository<StudentLoanBalances>,
  ) {}

  async getSummaryByStatus(): Promise<StudentLoanBalances[]> {
    return [];
  }
}
