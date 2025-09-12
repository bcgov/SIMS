import { Injectable } from "@nestjs/common";
import { SystemUsersService } from "@sims/services";
import {
  Application,
  ApplicationData,
  ApplicationEditStatus,
  ApplicationStatus,
  RecordDataModelService,
} from "@sims/sims-db";
import { hashObjectToHex } from "@sims/utilities";
import { DataSource, In, UpdateResult } from "typeorm";

@Injectable()
export class ApplicationService extends RecordDataModelService<Application> {
  constructor(
    dataSource: DataSource,
    private readonly systemUsersService: SystemUsersService,
  ) {
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
    const now = new Date();
    return this.repo.update(
      {
        id: applicationId,
        applicationStatus: In([fromStatus, toStatus]),
      },
      {
        applicationStatus: toStatus,
        applicationStatusUpdatedOn: now,
        modifier: this.systemUsersService.systemUser,
        updatedAt: now,
      },
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
        applicationNumber: true,
        applicationEditStatus: true,
        submittedDate: true,
        pirStatus: true,
        student: {
          id: true,
          birthDate: true,
          user: { id: true, firstName: true, lastName: true, email: true },
        },
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
        currentAssessment: {
          id: true,
          offering: { id: true, studyEndDate: true },
        },
      },
      relations: {
        applicationException: true,
        student: { user: true },
        currentAssessment: { offering: true },
      },
      where: {
        id: applicationId,
      },
    });
  }

  /**
   * Updates the application edit status to desired status if not updated yet.
   * @param applicationId application to be updated.
   * @param fromStatus expected status of the application.
   * @param toStatus desired status to be updated.
   * @returns update result.
   */
  async updateApplicationEditStatus(
    applicationId: number,
    fromStatus: ApplicationEditStatus,
    toStatus: ApplicationEditStatus,
  ): Promise<UpdateResult> {
    const now = new Date();
    return this.repo.update(
      {
        id: applicationId,
        applicationEditStatus: fromStatus,
      },
      {
        applicationEditStatus: toStatus,
        applicationEditStatusUpdatedOn: now,
        applicationEditStatusUpdatedBy: this.systemUsersService.systemUser,
        modifier: this.systemUsersService.systemUser,
        updatedAt: now,
      },
    );
  }

  /**
   * Generates a hash based on the program persistent properties
   * defined in the application data.
   * @param applicationData application data to extract the program persistent
   * properties and generate the hash.
   * @returns hexadecimal hash of the program persistent properties
   * or null if the application does not support program data verification.
   */
  getProgramDataHash(applicationData: ApplicationData): string | null {
    const programProperties = applicationData.programPersistentProperties;
    // Return null if program persistent properties are not defined,
    // since the application does not support program data verification.
    if (!programProperties?.length) {
      return null;
    }
    const programDataHashableContent = {};
    for (const propertyName of programProperties) {
      if (applicationData.hasOwnProperty(propertyName)) {
        programDataHashableContent[propertyName] =
          applicationData[propertyName];
      }
    }
    return hashObjectToHex(JSON.stringify(programDataHashableContent));
  }
}
