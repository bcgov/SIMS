import { Injectable } from "@nestjs/common";
import { LoggerService } from "../logger/logger.service";
import { Connection } from "typeorm";
import { InjectLogger } from "../common";

@Injectable()
export class DatabaseService {
  @InjectLogger()
  logger: LoggerService;

  constructor(public connection: Connection) {}
}
