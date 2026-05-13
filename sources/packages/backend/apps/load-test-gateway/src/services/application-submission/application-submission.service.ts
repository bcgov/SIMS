import { Injectable, NotFoundException } from "@nestjs/common";
import {
  Application,
  ApplicationData,
  ApplicationStatus,
  AssessmentTriggerType,
  EducationProgramOffering,
  OfferingIntensity,
  ProgramInfoStatus,
  ProgramYear,
  Student,
  StudentAssessment,
  StudentAssessmentStatus,
} from "@sims/sims-db";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeApplication,
  createFakeEducationProgramOffering,
  createFakeStudentAssessment,
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
   * Institution location ID associated with the offering.
   */
  locationId: number;
  /**
   * Program year ID to use when submitting the application.
   */
  programYearId: number;
}

/**
 * Response returned by the setup endpoint containing all data required
 * to run the application submission load test iterations.
 */
export interface ApplicationSubmissionSetupResponse {
  /**
   * Per-iteration application data for each draft application created.
   */
  applications: ApplicationSetupData[];
  /**
   * Base application data payload to use when submitting each application.
   * The selectedOffering, selectedProgram, and selectedLocation fields must
   * be overridden per iteration using the values from the applications array.
   */
  applicationData: Record<string, unknown>;
}

/**
 * Prefix used for fake student user names created for the workers stress load test.
 */
const WORKER_STRESS_STUDENT_USERNAME_PREFIX = "student_load_test_worker_";

/**
 * Response returned by the workers setup endpoint with a summary of the created applications.
 */
export interface WorkersSetupResponse {
  /**
   * Total number of submitted applications created across all fake students.
   */
  totalApplicationsCreated: number;
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
   * @param batchSize number of draft applications to create in this batch.
   * @param studentUserName user name of the e2e test student.
   * @returns setup response containing per-iteration application data and the base application payload.
   */
  async createDraftApplications(
    batchSize: number,
    studentUserName: string,
  ): Promise<ApplicationSubmissionSetupResponse> {
    const student = await this.getOrCreateStudentByUserName(studentUserName);
    const programYear = await this.getProgramYear(LOAD_TEST_PROGRAM_YEAR);
    const setupItems: ApplicationSetupData[] = [];
    const offerings: EducationProgramOffering[] = [];
    for (let i = 0; i < batchSize; i++) {
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
      offerings.push(
        createFakeEducationProgramOffering(
          { auditUser: student.user },
          { initialValues: { studyStartDate, studyEndDate } },
        ),
      );
    }
    // Bulk-save offerings in chunks to avoid pgbouncer connection churn and DB timeouts.
    const savedOfferings = await this.dataSources.educationProgramOffering.save(
      offerings,
      { chunk: 100 },
    );
    const applications: Application[] = savedOfferings.map((savedOffering) =>
      createFakeApplication(
        {
          student,
          location: savedOffering.institutionLocation,
          applicationEditStatusUpdatedBy: student.user,
          programYear,
        },
        {
          initialValue: {
            data: APPLICATION_SUBMISSION_DATA as ApplicationData,
            offeringIntensity: OfferingIntensity.fullTime,
          },
        },
      ),
    );
    // Bulk-save applications in chunks.
    const savedApplications = await this.dataSources.application.save(
      applications,
      { chunk: 100 },
    );
    // Link each application to itself as parent and preceding. The DB check constraint
    // requires parent_application_id to be non-null for non-Draft applications, so the
    // applications must be inserted as Draft first and then updated with their own IDs.
    await Promise.all(
      savedApplications.map((app) =>
        this.dataSources.application.update(app.id, {
          parentApplication: { id: app.id },
          precedingApplication: { id: app.id },
        }),
      ),
    );
    for (let i = 0; i < savedApplications.length; i++) {
      setupItems.push({
        applicationId: savedApplications[i].id,
        offeringId: savedOfferings[i].id,
        programId: savedOfferings[i].educationProgram.id,
        locationId: savedOfferings[i].institutionLocation.id,
        programYearId: programYear.id,
      });
    }
    return {
      applications: setupItems,
      applicationData: APPLICATION_SUBMISSION_DATA,
    };
  }

  /**
   * Creates submitted applications across multiple fake students to stress-test the workers pipeline.
   * Applications are written directly to the database in the Submitted state with assessments also
   * in the Submitted state, so the queue-consumers scheduler will detect them and start the
   * Camunda workflow instances without requiring any Keycloak token or API call per student.
   * Distributing across multiple students prevents all workflow instances from sharing the same
   * Camunda process tree, enabling better parallelism in the workers.
   * @param batchSize total number of submitted applications to create in this batch.
   * @param numberOfStudents number of distinct fake students to spread applications across.
   * @returns summary with the total number of submitted applications created.
   */
  async createSubmittedApplications(
    batchSize: number,
    numberOfStudents: number,
  ): Promise<WorkersSetupResponse> {
    const programYear = await this.getProgramYear(LOAD_TEST_PROGRAM_YEAR);
    const appsPerStudent = Math.ceil(batchSize / numberOfStudents);
    let totalCreated = 0;
    for (
      let studentIndex = 0;
      studentIndex < numberOfStudents;
      studentIndex++
    ) {
      const remaining = batchSize - totalCreated;
      if (remaining <= 0) {
        break;
      }
      const studentApps = Math.min(appsPerStudent, remaining);
      const studentUserName = `${WORKER_STRESS_STUDENT_USERNAME_PREFIX}${studentIndex + 1}`;
      const student = await this.getOrCreateStudentByUserName(studentUserName);
      // Create unique non-overlapping offerings for each application under this student.
      const offerings: EducationProgramOffering[] = [];
      for (let i = 0; i < studentApps; i++) {
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
        offerings.push(
          createFakeEducationProgramOffering(
            { auditUser: student.user },
            { initialValues: { studyStartDate, studyEndDate } },
          ),
        );
      }
      const savedOfferings =
        await this.dataSources.educationProgramOffering.save(offerings, {
          chunk: 100,
        });
      // Create applications as Draft first. The DB check constraint requires
      // parent_application_id to be non-null for non-Draft applications, so the
      // status and parent must be set in a subsequent update after the IDs are known.
      const applications: Application[] = savedOfferings.map((offering) =>
        createFakeApplication(
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
              pirStatus: ProgramInfoStatus.notRequired,
            },
          },
        ),
      );
      const savedApplications = await this.dataSources.application.save(
        applications,
        { chunk: 100 },
      );
      // Update each application to Submitted status and link it to itself as parent
      // and preceding. Setting pirStatus to notRequired tells the Camunda PIR worker
      // to skip the PIR step and proceed directly to assessment.
      const submittedDate = new Date();
      await Promise.all(
        savedApplications.map((app) =>
          this.dataSources.application.update(app.id, {
            applicationStatus: ApplicationStatus.Submitted,
            submittedDate,
            parentApplication: { id: app.id },
            precedingApplication: { id: app.id },
          }),
        ),
      );
      // Create assessments in Submitted status so the workflow enqueuer
      // picks them up on its next run and puts them in the start-assessment queue.
      const assessments: StudentAssessment[] = savedApplications.map((app, i) =>
        createFakeStudentAssessment(
          {
            auditUser: student.user,
            application: app,
            offering: savedOfferings[i],
          },
          {
            initialValue: {
              studentAssessmentStatus: StudentAssessmentStatus.Submitted,
              triggerType: AssessmentTriggerType.OriginalAssessment,
              submittedDate: new Date(),
            },
          },
        ),
      );
      const savedAssessments = await this.dataSources.studentAssessment.save(
        assessments,
        { chunk: 100 },
      );
      // Link the current assessment on each application.
      await Promise.all(
        savedApplications.map((app, i) =>
          this.dataSources.application.update(app.id, {
            currentAssessment: { id: savedAssessments[i].id },
          }),
        ),
      );
      totalCreated += studentApps;
    }
    return { totalApplicationsCreated: totalCreated };
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

  /**
   * Looks up a student by user name, creating one if it does not
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
