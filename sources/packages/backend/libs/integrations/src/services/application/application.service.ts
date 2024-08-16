import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { Application } from "@sims/sims-db";
import { InjectRepository } from "@nestjs/typeorm";

/**
 * Consists of all application services which are specific to the integration.
 */
@Injectable()
export class ApplicationService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
  ) {}

  async getDateChangeNotReportedApplication(): Promise<boolean> {
    return false;
  }
}
