import { Injectable } from "@nestjs/common";
import {
  Application,
  ApplicationStatus,
  ProgramInfoStatus,
  RecordDataModelService,
} from "@sims/sims-db";
import { DataSource, In, IsNull, UpdateResult } from "typeorm";

@Injectable()
export class ApplicationService extends RecordDataModelService<Application> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(Application));
  }

  /**
   * Updates the student application status ensuring that the application
   * was in the expected state and also allowing the method to be called
   * multiple times without causing any harm to enure the idempotency.
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

  /**
   * Updates the Program Information Request (PIR) for the first time.
   * If the PIR is already set the update will be ignore and no rows
   * will be affected.
   * @param applicationId application to have the PIR updated.
   * @param pirStatus status to be updated.
   * @returns update result.
   */
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

  /**
   * Gets the application information with additional options to load the data.
   * @param applicationId application t have the data loaded.
   * @param options data load options.
   * @returns application information.
   */
  async getApplicationById(
    applicationId: number,
    options?: { loadDynamicData: boolean },
  ): Promise<Application> {
    return this.repo.findOne({
      select: {
        id: true,
        pirStatus: true,
        data: !options?.loadDynamicData
          ? undefined
          : {
              // TODO: change data to be unknown in the entity model.
              selectedLocation: true,
            },
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
