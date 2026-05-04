import { Injectable, NotFoundException } from "@nestjs/common";
import {
  Application,
  ApplicationData,
  OfferingIntensity,
  ProgramYear,
  Student,
} from "@sims/sims-db";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeApplication,
  createFakeEducationProgramOffering,
  createFakeUser,
  saveFakeStudent,
} from "@sims/test-utils";
import { addDays, getISODateOnlyString } from "@sims/utilities";
import { DataSource } from "typeorm";
import { APPLICATION_SUBMISSION_DATA } from "../../constants/application-submission.constants";

/**
 * Number of days between each offering's study start date to ensure
 * no two offerings overlap for the same student.
 */
const OFFERING_DATE_SPACING_DAYS = 20;
/**
 * Duration in days for each offering's study period.
 */
const OFFERING_DURATION_DAYS = 14;
/**
 * Starting offset in days from today for the first offering's study start date,
 * ensuring offerings are in the future.
 */
const OFFERING_START_OFFSET_DAYS = 30;

/**
 * Program year used for the application submission load test.
 */
const LOAD_TEST_PROGRAM_YEAR = "2026-2027";

/**
 * Setup data for a single load test iteration.
 */
export interface ApplicationSetupData {
  /**
   * Draft application ID to submit.
   */
  applicationId: number;
  /**
   * Offering ID associated with the draft application.
   */
  offeringId: number;
  /**
   * Education program ID associated with the offering.
   */
  programId: number;
  /**
   * Program year ID to use when submitting the application.
   */
  programYearId: number;
}

@Injectable()
export class ApplicationSubmissionService {
  private readonly dataSources: E2EDataSources;

  constructor(dataSource: DataSource) {
    this.dataSources = createE2EDataSources(dataSource);
  }

  /**
   * Creates draft applications for load testing using the e2e test student.
   * Each application is associated with a unique offering with non-overlapping
   * study dates, allowing the real submit endpoint to be called without
   * triggering the study date overlap validation.
   * @param iterations number of draft applications to create.
   * @param studentUserName user name of the e2e test student.
   * @returns per-iteration setup data containing application, offering and program IDs.
   */
  async createDraftApplications(
    iterations: number,
    studentUserName: string,
  ): Promise<ApplicationSetupData[]> {
    const student = await this.getOrCreateStudentByUserName(studentUserName);
    const programYear = await this.getProgramYear(LOAD_TEST_PROGRAM_YEAR);
    const setupItems: ApplicationSetupData[] = [];
    const applications: Application[] = [];
    for (let i = 0; i < iterations; i++) {
      const studyStartDate = getISODateOnlyString(
        addDays(OFFERING_START_OFFSET_DAYS + i * OFFERING_DATE_SPACING_DAYS),
      );
      const studyEndDate = getISODateOnlyString(
        addDays(
          OFFERING_START_OFFSET_DAYS +
            i * OFFERING_DATE_SPACING_DAYS +
            OFFERING_DURATION_DAYS,
        ),
      );
      const offering = createFakeEducationProgramOffering(
        { auditUser: student.user },
        { initialValues: { studyStartDate, studyEndDate } },
      );
      const savedOffering =
        await this.dataSources.educationProgramOffering.save(offering);
      const application = createFakeApplication(
        {
          student,
          location: offering.institutionLocation,
          applicationEditStatusUpdatedBy: student.user,
          programYear,
        },
        {
          initialValue: {
            data: APPLICATION_SUBMISSION_DATA as ApplicationData,
            offeringIntensity: OfferingIntensity.fullTime,
          },
        },
      );
      applications.push(application);
      setupItems.push({
        applicationId: 0,
        offeringId: savedOffering.id,
        programId: savedOffering.educationProgram.id,
        programYearId: programYear.id,
      });
    }
    const savedApplications =
      await this.dataSources.application.save(applications);
    for (let i = 0; i < savedApplications.length; i++) {
      setupItems[i].applicationId = savedApplications[i].id;
    }
    return setupItems;
  }

  /**
   * Retrieves the 2026-2027 program year from the database.
   * @param programYearLabel program year string in the format YYYY-YYYY.
   * @returns the matching program year entity.
   */
  private async getProgramYear(programYearLabel: string): Promise<ProgramYear> {
    const programYear = await this.dataSources.programYear.findOne({
      where: { programYear: programYearLabel },
    });
    if (!programYear) {
      throw new NotFoundException(
        `Program year ${programYearLabel} not found.`,
      );
    }
    return programYear;
  }

  /**, creating one if it does not
   * yet exist in the current database. Creating the student on demand allows the load
   * test to run against the local dev database where the e2e test student is not
   * pre-seeded, while still matching the Keycloak JWT that k6 obtains for that user.
   * @param userName user name to look up or create.
   * @returns the matching or newly created student.
   */
  private async getOrCreateStudentByUserName(
    userName: string,
  ): Promise<Student> {
    const existing = await this.dataSources.student.findOne({
      where: { user: { userName } },
      relations: { user: true },
    });
    if (existing) {
      return existing;
    }
    return saveFakeStudent(this.dataSources.dataSource, {
      user: createFakeUser(userName),
    });
  }
}
