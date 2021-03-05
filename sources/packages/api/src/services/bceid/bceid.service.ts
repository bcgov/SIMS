import { Injectable } from "@nestjs/common";
import soap from "soap";
import { InjectLogger } from "src/common";
import { LoggerService } from "src/logger/logger.service";

@Injectable()
export class BCeIDService {
  @InjectLogger()
  logger: LoggerService;
}
