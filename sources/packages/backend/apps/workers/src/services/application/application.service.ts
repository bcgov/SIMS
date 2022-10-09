import { Injectable } from "@nestjs/common";
import {
  Application,
  ApplicationStatus,
  ProgramInfoStatus,
  RecordDataModelService,
} from "@sims/sims-db";
import { DataSource, In, IsNull, UpdateResult } from "typeorm";

/**
 * Manages the student assessment related operations.
 */
@Injectable()
export class ApplicationService extends RecordDataModelService<Application> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(Application));
  }

  /**
   * Updates the student application status ensuring that the application
   * was in the expected state and also allowing the method to be called
   * multiple times without causing any harm to enure the impotency.
   * @param applicationId application to change the status.
   * @param fromStatus expected status of the application.
   * @param toStatus status to be updated, if not already.
   */
  async updateStatus(
    applicationId: number,
    fromStatus: ApplicationStatus,
    toStatus: ApplicationStatus,
  ): Promise<UpdateResult> {
    return this.repo.update(
      {
        id: applicationId,
        applicationStatus: In([fromStatus, toStatus]),
      },
      { applicationStatus: toStatus },
    );
  }

  async updateProgramInfoStatus(
    applicationId: number,
    pirStatus: ProgramInfoStatus,
  ): Promise<UpdateResult> {
    return this.repo.update(
      {
        id: applicationId,
        pirStatus: IsNull(),
      },
      { pirStatus },
    );
  }

  async getApplicationById(
    applicationId: number,
    options?: { loadDynamicData: boolean },
  ): Promise<Application> {
    return this.repo.findOne({
      select: {
        id: true,
        pirStatus: true,
        data: !options?.loadDynamicData
          ? {
              // TODO: change data to be unknown in the entity model.
              selectedLocation: true,
            }
          : undefined,
        applicationException: {
          id: true,
          exceptionStatus: true,
        },
      },
      relations: {
        applicationException: true,
      },
      where: {
        id: applicationId,
      },
    });
  }
}
