import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection } from "typeorm";
import { ProgramYear } from "../../database/entities/program-year.model";

@Injectable()
export class ProgramYearService extends RecordDataModelService<ProgramYear> {
  constructor(@Inject("Connection") private readonly connection: Connection) {
    super(connection.getRepository(ProgramYear));
  }

  async getProgramYears(): Promise<ProgramYear[]> {
    const programYear = await this.repo
      .createQueryBuilder("programyear")
      .where("programYear.active_indicator = true")
      .getMany();
    return programYear;
  }
}
