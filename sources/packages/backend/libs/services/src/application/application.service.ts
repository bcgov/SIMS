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
  async hasMultipleApplicationSubmissions(
    applicationNumber: string,
  ): Promise<Boolean> {
    const applicationSubmissions = await this.applicationRepo.find({
      select: {
        id: true,
      },
      where: {
        applicationNumber: applicationNumber,
      },
    });
    return applicationSubmissions.length > 1 ? true : false;
  }
}
