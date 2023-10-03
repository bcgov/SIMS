import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { Application } from "@sims/sims-db";
import { InjectRepository } from "@nestjs/typeorm";

/**
 * Service layer for Application.
 */
@Injectable()
export class ApplicationService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
  ) {}

  /**
   * TODO: ANN
   */
  async hasMultipleApplicationSubmission(
    applicationNumber: string,
  ): Promise<Boolean> {
    const applicationSubmissions = this.applicationRepo.find({
      select: {
        id: true,
      },
      where: {
        applicationNumber: applicationNumber,
      },
    });
    return (await applicationSubmissions).length > 1 ? true : false;
  }
}
