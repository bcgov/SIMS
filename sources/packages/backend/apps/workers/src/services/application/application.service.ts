import { Injectable } from "@nestjs/common";
import {
  Application,
  ApplicationStatus,
  AssessmentTriggerType,
  MSFAANumber,
  OfferingIntensity,
  ProgramInfoStatus,
  RecordDataModelService,
} from "@sims/sims-db";
import { CustomNamedError } from "@sims/utilities";
import { DataSource, In, IsNull, UpdateResult } from "typeorm";
import { MSFAANumberService } from "..";
import {
  APPLICATION_MSFAA_ALREADY_ASSOCIATED,
  APPLICATION_NOT_FOUND,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
} from "../../constants";

@Injectable()
export class ApplicationService extends RecordDataModelService<Application> {
  constructor(
    dataSource: DataSource,
    private readonly msfaaNumberService: MSFAANumberService,
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
   * @param locationId location selected by the student.
   * @param pirProgram optional program selected by the student.
   * When not provided the PIR will be required to be completed by
   * the institution.
   * @returns update result.
   */
  async updateProgramInfoStatus(
    applicationId: number,
    pirStatus: ProgramInfoStatus,
    locationId: number,
    pirProgram?: number,
  ): Promise<UpdateResult> {
    return this.repo.update(
      {
        id: applicationId,
        pirStatus: IsNull(),
      },
      {
        pirStatus,
        location: { id: locationId },
        pirProgram: { id: pirProgram },
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

  /**
   * Associates an MSFAA number to the application checking
   * whatever is needed to create a new MSFAA or use an
   * existing one instead.
   * @param applicationId application id to receive an MSFAA.
   */
  async associateMSFAANumber(applicationId: number): Promise<Application> {
    const application = await this.repo.findOne({
      select: {
        id: true,
        applicationStatus: true,
        student: {
          id: true,
        },
        currentAssessment: {
          id: true,
          offering: {
            id: true,
            offeringIntensity: true,
          },
        },
        msfaaNumber: {
          id: true,
        },
      },
      relations: {
        student: true,
        currentAssessment: {
          offering: true,
        },
      },
      where: {
        id: applicationId,
      },
    });

    if (!application) {
      throw new CustomNamedError(
        "Student Application not found or one of its associations is missing.",
        APPLICATION_NOT_FOUND,
      );
    }

    if (application.msfaaNumber?.id) {
      throw new CustomNamedError(
        "MSFAA number is already associated.",
        APPLICATION_MSFAA_ALREADY_ASSOCIATED,
      );
    }

    if (application.applicationStatus !== ApplicationStatus.assessment) {
      throw new CustomNamedError(
        `Student Application is not in the expected status. The application must be in application status '${ApplicationStatus.assessment}' for an MSFAA number be assigned.`,
        INVALID_OPERATION_IN_THE_CURRENT_STATUS,
      );
    }

    let msfaaNumberId: number;

    // Checks if there is an MSFAA that could be considered valid.
    const existingValidMSFAANumber =
      await this.msfaaNumberService.getCurrentValidMSFAANumber(
        application.student.id,
        application.currentAssessment.offering.offeringIntensity,
      );
    if (existingValidMSFAANumber) {
      // Reuse the MSFAA that is still valid and avoid creating a new one.
      msfaaNumberId = existingValidMSFAANumber.id;
    } else {
      // Get previously completed and signed application for the student
      // to determine if an existing MSFAA is still valid.
      const previousSignedApplication =
        await this.getPreviouslySignedApplication(
          application.student.id,
          application.currentAssessment.offering.offeringIntensity,
        );

      let hasValidMSFAANumber = false;
      if (previousSignedApplication) {
        const [originalAssessment] =
          previousSignedApplication.studentAssessments;
        // checks if the MSFAA number is still valid.
        hasValidMSFAANumber = this.msfaaNumberService.isMSFAANumberValid(
          // Previously signed and completed application offering end date in considered the start date.
          originalAssessment.offering.studyEndDate,
          // Start date of the offering of the current application is considered the end date.
          originalAssessment.offering.studyStartDate,
        );
      }

      if (hasValidMSFAANumber) {
        // Reuse the MSFAA number.
        msfaaNumberId = previousSignedApplication.msfaaNumber.id;
      } else {
        // Create a new MSFAA number case the previous one is no longer valid.
        const newMSFAANumber = await this.msfaaNumberService.createMSFAANumber(
          application.student.id,
          applicationId,
          application.currentAssessment.offering.offeringIntensity,
        );
        msfaaNumberId = newMSFAANumber.id;
      }
    }

    // Associate the MSFAA number with the application.
    application.msfaaNumber = { id: msfaaNumberId } as MSFAANumber;

    return this.repo.save(application);
  }

  /**
   * Gets the application that has an MSFAA signed date.
   * @param studentId student id to filter the applications.
   * @param offeringIntensity MSFAA are generated individually for full-time/part-time
   * applications. The offering intensity is used to differentiate between them.
   * @returns previous signed application if exists, otherwise null.
   */
  async getPreviouslySignedApplication(
    studentId: number,
    offeringIntensity: OfferingIntensity,
  ): Promise<Application> {
    return this.repo
      .createQueryBuilder("applications")
      .select(["applications.id", "msfaaNumbers.id", "offerings.studyEndDate"])
      .innerJoin("applications.studentAssessments", "assessment")
      .innerJoin("assessment.offering", "offerings")
      .innerJoin("applications.msfaaNumber", "msfaaNumbers")
      .innerJoin("applications.student", "students")
      .where("applications.applicationStatus = :completedStatus", {
        completedStatus: ApplicationStatus.completed,
      })
      .andWhere("assessment.triggerType = :triggerType", {
        triggerType: AssessmentTriggerType.OriginalAssessment,
      })
      .andWhere("students.id = :studentId", { studentId })
      .andWhere("msfaaNumbers.dateSigned is not null")
      .andWhere("msfaaNumbers.offeringIntensity = :offeringIntensity", {
        offeringIntensity,
      })
      .orderBy("offerings.studyEndDate", "DESC")
      .limit(1)
      .getOne();
  }
}
