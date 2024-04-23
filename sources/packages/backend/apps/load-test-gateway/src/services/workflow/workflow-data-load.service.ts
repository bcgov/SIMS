import { Injectable } from "@nestjs/common";
import {
  Application,
  ApplicationData,
  EducationProgramOffering,
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
  saveFakeStudent,
} from "@sims/test-utils";
import { DataSource } from "typeorm";
import { APPLICATION_DATA_SINGLE_INDEPENDENT } from "../../constants/application.constants";

interface ApplicationPreliminaryData {
  offering: EducationProgramOffering;
  student: Student;
}

@Injectable()
export class WorkflowDataLoadService {
  private readonly dataSources: E2EDataSources;
  constructor(private readonly dataSource: DataSource) {
    this.dataSources = createE2EDataSources(dataSource);
  }

  /**
   * Load the application and assessment data required for the load test.
   * @param iterations load test iterations.
   * @returns student assessments.
   */
  async createApplicationAssessmentData(
    iterations: number,
  ): Promise<StudentAssessment[]> {
    const preliminaryData = await this.createApplicationPreliminaryData();
    const applications: Application[] = [];
    for (let i = 1; i <= iterations; i++) {
      const submittedApplicationData = {
        ...APPLICATION_DATA_SINGLE_INDEPENDENT,
        selectedOffering: preliminaryData.offering.id,
      };
      const application = createFakeApplication(
        {
          student: preliminaryData.student,
          location: preliminaryData.offering.institutionLocation,
        },
        { initialValue: { data: submittedApplicationData } },
      );
      applications.push(application);
    }
    return this.saveApplicationAssessments(
      applications,
      preliminaryData.offering,
    );
  }

  /**
   * Create preliminary data required to build the iteration of applications.
   * @returns preliminary data.
   */
  private async createApplicationPreliminaryData(): Promise<ApplicationPreliminaryData> {
    const student = await saveFakeStudent(this.dataSource);
    const offering = await this.dataSources.educationProgramOffering.save(
      createFakeEducationProgramOffering({ auditUser: student.user }),
    );
    return { offering, student };
  }

  /**
   * Save the application and assessment data.
   * @param applications applications.
   * @param offering offering.
   * @returns assessments.
   */
  private async saveApplicationAssessments(
    applications: Application[],
    offering: EducationProgramOffering,
  ): Promise<StudentAssessment[]> {
    await this.dataSources.application.insert(applications);
    applications.forEach((application) => {
      const studentAssessment = createFakeStudentAssessment(
        {
          auditUser: application.student.user,
          application,
          offering: offering,
        },
        {
          initialValue: {
            studentAssessmentStatus: StudentAssessmentStatus.Queued,
          },
        },
      );
      application.currentAssessment = studentAssessment;
    });

    const assessments = applications.map((app) => app.currentAssessment);

    await this.dataSources.studentAssessment.insert(assessments);

    //Update the current assessment for the applications.
    for (const application of applications) {
      await this.dataSources.application.update(
        { id: application.id },
        { currentAssessment: application.currentAssessment },
      );
    }

    return assessments;
  }
}
