import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { Application } from "@sims/sims-db";
import { InjectRepository } from "@nestjs/typeorm";

/**
 * Service layer for Application.
 */
@Injectable()
export class ApplicationSharedService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
  ) {}

  /**
   * Checks if there was multiple submission for an application
   * (i.e student edits an application after submission).
   * @param applicationNumber application number.
   * @returns true if there was multiple submission for
   * an application.
   */
  async hasMultipleApplicationSubmissions(
    applicationNumber: string,
  ): Promise<boolean> {
    const applicationSubmissions = await this.applicationRepo.count({
      where: {
        applicationNumber: applicationNumber,
      },
    });
    return applicationSubmissions > 1;
  }
}
