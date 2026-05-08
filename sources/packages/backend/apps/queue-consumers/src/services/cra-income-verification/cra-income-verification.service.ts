import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CRAIncomeVerification } from "@sims/sims-db";
import { OverdueCRAIncomeVerification } from "apps/queue-consumers/src/services/cra-income-verification/cra-income-verification.models";
import { IsNull, LessThan, Repository } from "typeorm";

@Injectable()
export class CRAIncomeVerificationService {
  constructor(
    @InjectRepository(CRAIncomeVerification)
    private readonly craIncomeVerificationRepo: Repository<CRAIncomeVerification>,
  ) {}

  OVERDUE_TIMEFRAME_MILLISECONDS = 5 * 24 * 60 * 60 * 1000;

  async findOverdueResponses(): Promise<OverdueCRAIncomeVerification[]> {
    const incomeVerifications: CRAIncomeVerification[] =
      await this.craIncomeVerificationRepo.find({
        select: {
          dateSent: true,
          fileSent: true,
        },
        where: {
          dateReceived: IsNull(),
          dateSent: LessThan(
            new Date(Date.now() - this.OVERDUE_TIMEFRAME_MILLISECONDS),
          ),
        },
      });

    const formattedOverdueResponses: OverdueCRAIncomeVerification[] =
      incomeVerifications.map((response) => ({
        fileName: response.fileSent!,
        dateSent: response.dateSent!,
        type: "CRA",
      }));

    console.log(
      "Overdue CRA Income Verifications: ",
      formattedOverdueResponses,
    );

    return formattedOverdueResponses;
  }
}
