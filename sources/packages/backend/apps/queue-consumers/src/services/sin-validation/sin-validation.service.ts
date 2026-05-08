import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { SINValidation } from "@sims/sims-db";
import { OverdueSINValidation } from "apps/queue-consumers/src/services/sin-validation/sin-verification.models";
import { IsNull, LessThan, Repository } from "typeorm";

@Injectable()
export class SINValidationService {
  constructor(
    @InjectRepository(SINValidation)
    private readonly sinValidationRepo: Repository<SINValidation>,
  ) {}

  OVERDUE_TIMEFRAME_MILLISECONDS = 5 * 24 * 60 * 60 * 1000;

  async findOverdueResponses(): Promise<OverdueSINValidation[]> {
    const sinValidations: SINValidation[] = await this.sinValidationRepo.find({
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

    const formattedOverdueResponses: OverdueSINValidation[] =
      sinValidations.map((response) => ({
        fileName: response.fileSent!,
        dateSent: response.dateSent!,
        type: "SIN",
      }));

    console.log("Overdue SIN Validations: ", formattedOverdueResponses);

    return formattedOverdueResponses;
  }
}
