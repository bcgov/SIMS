import { Injectable, Inject } from "@nestjs/common";
import { InjectLogger } from "../../common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection } from "typeorm";
import { LoggerService } from "../../logger/logger.service";
import { ProgramYear } from "../../database/entities/program-year.model";

@Injectable()
export class ProgramYearService extends RecordDataModelService<ProgramYear> {
  @InjectLogger()
  logger: LoggerService;

  async getProgramYears(): Promise<ProgramYear[]> {
    const programYear = await this.repo
      .createQueryBuilder("programYear")
      .where("programYear.active = true")
      .getMany();
    return programYear;
  }
}
