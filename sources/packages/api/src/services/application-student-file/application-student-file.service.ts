import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection } from "typeorm";
import { LoggerService } from "../../logger/logger.service";
import { InjectLogger } from "../../common";
import { ApplicationStudentFile } from "../../database/entities";

@Injectable()
export class ApplicationStudentFileService extends RecordDataModelService<ApplicationStudentFile> {
  constructor(@Inject("Connection") connection: Connection) {
    super(connection.getRepository(ApplicationStudentFile));
  }

  @InjectLogger()
  logger: LoggerService;
}
